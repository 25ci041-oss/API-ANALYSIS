import os
import json
import io
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_connection, init_db, now_iso
from models import (
    ApiKeyCreate, ApiKeyUpdate, ApiKeyRevoke, ApiKeyRotate, ApiKeyReview,
    ActivitySubmit, IncidentConfirm, ChecklistUpdate, SettingUpdate
)
from rules_engine import analyze_api_activity
from simulation import (
    run_single_simulation, run_complete_breach_simulation, reset_simulation_data
)
from pdf_generator import generate_incident_pdf

app = FastAPI(
    title="Real Time API Analysis – Monitoring & Incident Response System",
    description="Cybersecurity Hackathon Platform developed by Tensor Terminators",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default port 5173, 3000, 8000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# =========================================================================
# 1. DASHBOARD & STATS (Calculated dynamically from database records)
# =========================================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    conn = get_connection()
    cursor = conn.cursor()

    # Total & Status Counts
    cursor.execute("SELECT COUNT(*) as count FROM api_keys")
    total_registered = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE status = 'ACTIVE'")
    active_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE status = 'INACTIVE'")
    inactive_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE status = 'REVOKED'")
    revoked_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE status = 'EXPIRED'")
    expired_keys = cursor.fetchone()['count']

    # Newly Added API Keys (in last 24 hours)
    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE created_date >= datetime('now', '-24 hours')")
    newly_added_keys = cursor.fetchone()['count']

    # Ownership & Control Counts
    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE ownership_type = 'INTERNAL'")
    internal_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE ownership_type = 'THIRD_PARTY'")
    third_party_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE control_type = 'HUMAN_CONTROLLED'")
    human_controlled_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE control_type = 'SOFTWARE_CONTROLLED'")
    software_controlled_keys = cursor.fetchone()['count']

    # Risk Categories (Shared and Over-privileged)
    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE is_shared = 1")
    shared_keys = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_keys WHERE is_overprivileged = 1")
    overprivileged_keys = cursor.fetchone()['count']

    # Unregistered API Keys Detected in Activity Logs
    cursor.execute("SELECT COUNT(DISTINCT key_id) as count FROM api_activity_logs WHERE is_unregistered = 1")
    unregistered_keys_detected = cursor.fetchone()['count']

    # Requests & Activity Counts
    cursor.execute("SELECT COUNT(*) as count FROM api_activity_logs")
    total_requests = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_activity_logs WHERE status = 'SAFE'")
    normal_requests = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM api_activity_logs WHERE status IN ('WARNING', 'SUSPICIOUS', 'CRITICAL')")
    suspicious_activities = cursor.fetchone()['count']

    # Active Security Alerts
    cursor.execute("SELECT COUNT(*) as count FROM security_alerts WHERE status = 'ACTIVE'")
    active_alerts = cursor.fetchone()['count']

    # Confirmed Security Breaches
    cursor.execute("SELECT COUNT(*) as count FROM security_incidents WHERE status = 'CONFIRMED_BREACH'")
    confirmed_breaches = cursor.fetchone()['count']

    # Affected API Keys in confirmed or open incidents
    cursor.execute("SELECT COUNT(DISTINCT key_id) as count FROM incident_related_keys")
    affected_keys = cursor.fetchone()['count']

    # Recent 8 activities
    cursor.execute("SELECT * FROM api_activity_logs ORDER BY timestamp DESC, id DESC LIMIT 8")
    recent_activities = [dict(r) for r in cursor.fetchall()]

    # Recent 5 alerts
    cursor.execute("SELECT * FROM security_alerts ORDER BY timestamp DESC, id DESC LIMIT 5")
    recent_alerts = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "total_registered_keys": total_registered,
        "active_keys": active_keys,
        "inactive_keys": inactive_keys,
        "revoked_keys": revoked_keys,
        "expired_keys": expired_keys,
        "newly_added_keys": newly_added_keys,
        "internal_keys": internal_keys,
        "third_party_keys": third_party_keys,
        "human_controlled_keys": human_controlled_keys,
        "software_controlled_keys": software_controlled_keys,
        "shared_keys": shared_keys,
        "overprivileged_keys": overprivileged_keys,
        "unregistered_keys_detected": unregistered_keys_detected,
        "total_requests": total_requests,
        "normal_requests": normal_requests,
        "suspicious_activities": suspicious_activities,
        "active_alerts": active_alerts,
        "confirmed_breaches": confirmed_breaches,
        "affected_keys": affected_keys,
        "recent_activities": recent_activities,
        "recent_alerts": recent_alerts
    }

# =========================================================================
# 2. API KEY INVENTORY (CRUD, Search, Filters, Detail, Classification)
# =========================================================================

@app.get("/api/keys")
def list_api_keys(
    search: Optional[str] = None,
    ownership: Optional[str] = None,
    control: Optional[str] = None,
    status: Optional[str] = None,
    system: Optional[str] = None
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM api_keys WHERE 1=1"
    params = []

    if search:
        query += " AND (key_id LIKE ? OR name LIKE ? OR owner_name LIKE ? OR connected_system LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if ownership and ownership.upper() != "ALL":
        query += " AND ownership_type = ?"
        params.append(ownership.upper())

    if control and control.upper() != "ALL":
        query += " AND control_type = ?"
        params.append(control.upper())

    if status and status.upper() != "ALL":
        query += " AND status = ?"
        params.append(status.upper())

    if system and system.upper() != "ALL":
        query += " AND connected_system = ?"
        params.append(system)

    query += " ORDER BY key_id ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        d['approved_ips'] = json.loads(d.get('approved_ips') or '[]')
        d['allowed_systems'] = json.loads(d.get('allowed_systems') or '[]')
        d['allowed_permissions'] = json.loads(d.get('allowed_permissions') or '[]')
        d['expected_permissions'] = json.loads(d.get('expected_permissions') or '[]')
        results.append(d)

    conn.close()
    return results

@app.get("/api/keys/{key_id}")
def get_api_key_detail(key_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"API key {key_id} not found.")

    key_data = dict(row)
    key_data['approved_ips'] = json.loads(key_data.get('approved_ips') or '[]')
    key_data['allowed_systems'] = json.loads(key_data.get('allowed_systems') or '[]')
    key_data['allowed_permissions'] = json.loads(key_data.get('allowed_permissions') or '[]')
    key_data['expected_permissions'] = json.loads(key_data.get('expected_permissions') or '[]')

    # Fetch recent activity for this key
    cursor.execute("SELECT * FROM api_activity_logs WHERE key_id = ? ORDER BY timestamp DESC, id DESC LIMIT 20", (key_id,))
    activity_history = [dict(r) for r in cursor.fetchall()]

    # Fetch key change history
    cursor.execute("SELECT * FROM key_change_history WHERE key_id = ? ORDER BY timestamp DESC", (key_id,))
    change_history = [dict(r) for r in cursor.fetchall()]

    # Fetch related alerts
    cursor.execute("SELECT * FROM security_alerts WHERE key_id = ? ORDER BY timestamp DESC", (key_id,))
    related_alerts = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "key_data": key_data,
        "activity_history": activity_history,
        "change_history": change_history,
        "related_alerts": related_alerts
    }

@app.post("/api/keys")
def create_api_key(payload: ApiKeyCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Generate sequential unique fictional ID, e.g. KEY-111, KEY-112
    cursor.execute("SELECT key_id FROM api_keys WHERE key_id LIKE 'KEY-%' ORDER BY key_id DESC")
    existing_ids = cursor.fetchall()
    
    max_num = 110
    for r in existing_ids:
        parts = r['key_id'].split('-')
        if len(parts) == 2 and parts[1].isdigit():
            num = int(parts[1])
            if num > max_num:
                max_num = num

    new_key_id = f"KEY-{max_num + 1}"
    created_ts = now_iso()
    
    # Calculate review date (30 days ahead)
    thirty_days = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    
    # Check over-privileged condition if expected permissions provided
    expected = payload.expected_permissions or payload.allowed_permissions
    is_overpriv = 1 if len(set(payload.allowed_permissions) - set(expected)) > 0 else 0
    is_shared = 1 if len(payload.approved_ips) > 1 else 0

    cursor.execute("""
        INSERT INTO api_keys (
            key_id, name, owner_name, ownership_type, control_type, connected_system,
            created_date, expiry_date, last_used_at, status, approved_ips, last_used_ip,
            allowed_systems, allowed_permissions, expected_permissions, total_requests,
            total_records_accessed, normal_records_threshold, review_status, last_reviewed_at,
            next_review_date, is_shared, is_overprivileged, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'ACTIVE', ?, NULL, ?, ?, ?, 0, 0, ?, 'REVIEWED', ?, ?, ?, ?, ?)
    """, (
        new_key_id,
        payload.name,
        payload.owner_name,
        payload.ownership_type,
        payload.control_type,
        payload.connected_system,
        created_ts,
        payload.expiry_date or (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d"),
        json.dumps(payload.approved_ips),
        json.dumps(payload.allowed_systems),
        json.dumps(payload.allowed_permissions),
        json.dumps(expected),
        payload.normal_records_threshold,
        created_ts,
        thirty_days,
        is_shared,
        is_overpriv,
        payload.notes or "Newly registered API key"
    ))

    # Record in key_change_history
    cursor.execute("""
        INSERT INTO key_change_history (timestamp, key_id, action_type, admin_name, details)
        VALUES (?, ?, 'ADDED', 'SecOps Admin', ?)
    """, (created_ts, new_key_id, f"Registered new key for {payload.owner_name} ({payload.ownership_type}, {payload.control_type})"))

    # Record in admin_actions
    cursor.execute("""
        INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
        VALUES (?, 'SecOps Admin', 'CREATE_KEY', ?, ?)
    """, (created_ts, new_key_id, f"Added key '{payload.name}' connected to '{payload.connected_system}'"))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "message": "New API key registered. Total key count updated.",
        "key_id": new_key_id
    }

@app.put("/api/keys/{key_id}")
def update_api_key(key_id: str, payload: ApiKeyUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found.")

    current = dict(row)
    name = payload.name if payload.name is not None else current['name']
    owner = payload.owner_name if payload.owner_name is not None else current['owner_name']
    ownership = payload.ownership_type if payload.ownership_type is not None else current['ownership_type']
    control = payload.control_type if payload.control_type is not None else current['control_type']
    system = payload.connected_system if payload.connected_system is not None else current['connected_system']
    ips = json.dumps(payload.approved_ips) if payload.approved_ips is not None else current['approved_ips']
    allowed_sys = json.dumps(payload.allowed_systems) if payload.allowed_systems is not None else current['allowed_systems']
    allowed_perms = json.dumps(payload.allowed_permissions) if payload.allowed_permissions is not None else current['allowed_permissions']
    expected_perms = json.dumps(payload.expected_permissions) if payload.expected_permissions is not None else current['expected_permissions']
    normal_thresh = payload.normal_records_threshold if payload.normal_records_threshold is not None else current['normal_records_threshold']
    notes = payload.notes if payload.notes is not None else current['notes']

    # Re-evaluate overprivileged
    parsed_allowed = json.loads(allowed_perms)
    parsed_expected = json.loads(expected_perms)
    is_overpriv = 1 if len(set(parsed_allowed) - set(parsed_expected)) > 0 else 0

    cursor.execute("""
        UPDATE api_keys 
        SET name = ?, owner_name = ?, ownership_type = ?, control_type = ?,
            connected_system = ?, approved_ips = ?, allowed_systems = ?,
            allowed_permissions = ?, expected_permissions = ?, normal_records_threshold = ?,
            notes = ?, is_overprivileged = ?
        WHERE key_id = ?
    """, (name, owner, ownership, control, system, ips, allowed_sys, allowed_perms, expected_perms, normal_thresh, notes, is_overpriv, key_id))

    ts = now_iso()
    cursor.execute("""
        INSERT INTO key_change_history (timestamp, key_id, action_type, admin_name, details)
        VALUES (?, ?, 'UPDATED', 'SecOps Admin', 'Key configuration parameters updated')
    """, (ts, key_id))

    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "message": f"API key {key_id} updated successfully."}

@app.post("/api/keys/{key_id}/revoke")
def revoke_api_key(key_id: str, payload: ApiKeyRevoke):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found.")

    ts = now_iso()
    cursor.execute("UPDATE api_keys SET status = 'REVOKED' WHERE key_id = ?", (key_id,))

    # Record in history
    cursor.execute("""
        INSERT INTO key_change_history (timestamp, key_id, action_type, admin_name, details)
        VALUES (?, ?, 'REVOKED', ?, ?)
    """, (ts, key_id, payload.admin_name, f"Key revoked: {payload.reason}"))

    # Record in admin actions
    cursor.execute("""
        INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
        VALUES (?, ?, 'REVOKE_KEY', ?, ?)
    """, (ts, payload.admin_name, key_id, f"Reason: {payload.reason}"))

    # If key is part of an active incident, record revocation event in incident timeline
    cursor.execute("SELECT incident_id FROM incident_related_keys WHERE key_id = ?", (key_id,))
    incidents = cursor.fetchall()
    for inc in incidents:
        cursor.execute("""
            INSERT INTO incident_timeline (incident_id, timestamp, event_title, event_description, event_type, actor)
            VALUES (?, ?, 'Compromised API Key Revoked', ?, 'REVOCATION', ?)
        """, (inc['incident_id'], ts, f"Administrator revoked {key_id}. Reason: {payload.reason}", payload.admin_name))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "message": f"API key {key_id} has been revoked successfully.",
        "key_id": key_id,
        "new_status": "REVOKED",
        "timestamp": ts
    }

@app.post("/api/keys/{key_id}/rotate")
def rotate_api_key(key_id: str, payload: ApiKeyRotate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found.")

    ts = now_iso()
    # Mark review status and record change
    cursor.execute("""
        UPDATE api_keys 
        SET review_status = 'UNDER_REVIEW',
            notes = notes || ' [Rotation Requested: ' || ? || ']'
        WHERE key_id = ?
    """, (payload.reason, key_id))

    cursor.execute("""
        INSERT INTO key_change_history (timestamp, key_id, action_type, admin_name, details)
        VALUES (?, ?, 'ROTATION_REQUESTED', ?, ?)
    """, (ts, key_id, payload.admin_name, f"Secret rotation initiated: {payload.reason}"))

    cursor.execute("""
        INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
        VALUES (?, ?, 'REQUEST_ROTATION', ?, ?)
    """, (ts, payload.admin_name, key_id, payload.reason))

    # Add to incident timeline if related
    cursor.execute("SELECT incident_id FROM incident_related_keys WHERE key_id = ?", (key_id,))
    incidents = cursor.fetchall()
    for inc in incidents:
        cursor.execute("""
            INSERT INTO incident_timeline (incident_id, timestamp, event_title, event_description, event_type, actor)
            VALUES (?, ?, 'Key Rotation Requested', ?, 'ROTATION', ?)
        """, (inc['incident_id'], ts, f"Rotation queued for {key_id}. Reason: {payload.reason}", payload.admin_name))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "message": f"Rotation requested for API key {key_id}."
    }

@app.post("/api/keys/{key_id}/review")
def review_api_key(key_id: str, payload: ApiKeyReview):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Key not found.")

    ts = now_iso()
    next_date = (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")

    cursor.execute("""
        UPDATE api_keys 
        SET review_status = ?, last_reviewed_at = ?, next_review_date = ?
        WHERE key_id = ?
    """, (payload.review_status, ts, next_date, key_id))

    cursor.execute("""
        INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
        VALUES (?, ?, 'REVIEW_KEY', ?, ?)
    """, (ts, payload.admin_name, key_id, f"Status: {payload.review_status} | {payload.notes}"))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "message": f"Review status updated for {key_id} to '{payload.review_status}'."
    }

# =========================================================================
# 3. CRITICAL KEYS (Shared & Over-privileged Management)
# =========================================================================

@app.get("/api/critical-keys")
def get_critical_keys():
    conn = get_connection()
    cursor = conn.cursor()

    # Shared Keys: keys flagged is_shared = 1 OR having requests from > 1 IP in activity logs
    cursor.execute("""
        SELECT ak.* FROM api_keys ak
        WHERE ak.is_shared = 1 OR ak.key_id IN (
            SELECT key_id FROM api_activity_logs 
            GROUP BY key_id HAVING COUNT(DISTINCT source_ip) > 1
        )
    """)
    shared_rows = cursor.fetchall()
    shared_keys = []
    for r in shared_rows:
        d = dict(r)
        d['approved_ips'] = json.loads(d.get('approved_ips') or '[]')
        # Fetch distinct source IPs observed in logs
        cursor.execute("SELECT DISTINCT source_ip FROM api_activity_logs WHERE key_id = ?", (d['key_id'],))
        observed = [row['source_ip'] for row in cursor.fetchall()]
        d['observed_ips'] = list(set(d['approved_ips'] + observed))
        d['unapproved_observed_ips'] = [ip for ip in d['observed_ips'] if ip not in d['approved_ips']]
        d['risk_level'] = "HIGH_RISK" if len(d['unapproved_observed_ips']) > 0 else "WARNING"
        shared_keys.append(d)

    # Over-Privileged Keys: keys with extra permissions beyond expected
    cursor.execute("SELECT * FROM api_keys WHERE is_overprivileged = 1")
    overpriv_rows = cursor.fetchall()
    overpriv_keys = []
    for r in overpriv_rows:
        d = dict(r)
        allowed = json.loads(d.get('allowed_permissions') or '[]')
        expected = json.loads(d.get('expected_permissions') or '[]')
        d['allowed_permissions'] = allowed
        d['expected_permissions'] = expected
        d['extra_permissions'] = [p for p in allowed if p not in expected]
        d['risk_level'] = "HIGH_RISK" if any("MODIFY" in p or "FINANCIAL" in p for p in d['extra_permissions']) else "WARNING"
        d['suggested_action'] = f"Revoke excessive permission(s): {', '.join(d['extra_permissions'])} to enforce least privilege."
        overpriv_keys.append(d)

    conn.close()
    return {
        "shared_keys": shared_keys,
        "overprivileged_keys": overpriv_keys
    }

# =========================================================================
# 4. LIVE MONITORING & ACTIVITIES
# =========================================================================

@app.get("/api/activity")
def get_activity_logs(
    limit: int = 50,
    status: Optional[str] = None,
    key_id: Optional[str] = None
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM api_activity_logs WHERE 1=1"
    params = []

    if status and status.upper() != "ALL":
        query += " AND status = ?"
        params.append(status.upper())

    if key_id:
        query += " AND key_id = ?"
        params.append(key_id)

    query += " ORDER BY timestamp DESC, id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/activity")
def submit_activity(payload: ActivitySubmit):
    res = analyze_api_activity(
        key_id=payload.key_id,
        source_ip=payload.source_ip,
        connected_system=payload.connected_system,
        activity_name=payload.activity_name,
        permission_used=payload.permission_used,
        records_accessed=payload.records_accessed
    )
    return res

# =========================================================================
# 5. SECURITY ALERTS
# =========================================================================

@app.get("/api/alerts")
def get_security_alerts(status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM security_alerts WHERE 1=1"
    params = []

    if status and status.upper() != "ALL":
        query += " AND status = ?"
        params.append(status.upper())

    query += " ORDER BY timestamp DESC, id DESC"
    cursor.execute(query, params)
    alerts = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return alerts

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE security_alerts SET status = 'ACKNOWLEDGED' WHERE alert_id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "message": f"Alert {alert_id} acknowledged."}

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE security_alerts SET status = 'RESOLVED' WHERE alert_id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "message": f"Alert {alert_id} resolved."}

# =========================================================================
# 6. ATTACK SIMULATION LAB
# =========================================================================

@app.post("/api/simulations/scenario/{scenario_id}")
def trigger_scenario(scenario_id: int):
    if scenario_id < 1 or scenario_id > 8:
        raise HTTPException(status_code=400, detail="Invalid scenario ID. Must be between 1 and 8.")
    result = run_single_simulation(scenario_id)
    return result

@app.post("/api/simulations/complete-breach")
def trigger_complete_breach():
    result = run_complete_breach_simulation()
    return result

@app.post("/api/simulations/reset")
def trigger_reset():
    result = reset_simulation_data()
    return result

# =========================================================================
# 7. INCIDENT INVESTIGATION & INVOLVED KEYS
# =========================================================================

@app.get("/api/incidents")
def list_incidents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM security_incidents ORDER BY created_at DESC")
    incidents = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return incidents

@app.get("/api/incidents/{incident_id}")
def get_incident_detail(incident_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM security_incidents WHERE incident_id = ?", (incident_id,))
    inc_row = cursor.fetchone()
    if not inc_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    incident = dict(inc_row)

    # Fetch involved keys with rich attributes
    cursor.execute("""
        SELECT rk.*, ak.name, ak.owner_name, ak.ownership_type, ak.control_type,
               ak.status as key_status, ak.approved_ips as db_approved_ips,
               ak.connected_system as default_system
        FROM incident_related_keys rk
        LEFT JOIN api_keys ak ON rk.key_id = ak.key_id
        WHERE rk.incident_id = ?
    """, (incident_id,))
    involved_keys_raw = cursor.fetchall()
    
    involved_keys = []
    for r in involved_keys_raw:
        kd = dict(r)
        kd['ips_used'] = json.loads(kd.get('ips_used') or '[]')
        kd['permissions_used'] = json.loads(kd.get('permissions_used') or '[]')
        kd['systems_affected'] = json.loads(kd.get('systems_affected') or '[]')
        kd['db_approved_ips'] = json.loads(kd.get('db_approved_ips') or '[]') if kd.get('db_approved_ips') else []
        involved_keys.append(kd)

    # Fetch Timeline
    cursor.execute("SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC", (incident_id,))
    timeline = [dict(r) for r in cursor.fetchall()]

    # Fetch Checklist
    cursor.execute("SELECT * FROM incident_checklist WHERE incident_id = ? ORDER BY id ASC", (incident_id,))
    checklist = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "incident": incident,
        "involved_keys": involved_keys,
        "timeline": timeline,
        "checklist": checklist
    }

@app.post("/api/incidents/confirm")
def confirm_security_incident(payload: IncidentConfirm):
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc)
    incident_id = f"INC-{now.strftime('%Y')}-{str(int(now.timestamp()))[-4:]}"
    notice_time = payload.notice_time or now.isoformat()
    deadline_time = (now + timedelta(hours=6)).isoformat()

    cursor.execute("""
        INSERT INTO security_incidents (
            incident_id, title, description, status, created_at, notice_time,
            reporting_deadline, is_reportable, cert_in_status, evidence_reference
        ) VALUES (?, ?, ?, 'CONFIRMED_BREACH', ?, ?, ?, ?, 'Time Running', ?)
    """, (
        incident_id, payload.title, payload.description,
        now.isoformat(), notice_time, deadline_time,
        int(payload.is_reportable), payload.evidence_reference
    ))

    # Add initial timeline event
    cursor.execute("""
        INSERT INTO incident_timeline (incident_id, timestamp, event_title, event_description, event_type, actor)
        VALUES (?, ?, 'Incident Confirmed & CERT-In Notice Logged', ?, 'CONFIRMATION', 'SecOps Admin')
    """, (incident_id, notice_time, f"Official notice recorded for incident {incident_id}. 6-Hour reporting deadline initiated."))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "incident_id": incident_id,
        "notice_time": notice_time,
        "reporting_deadline": deadline_time
    }

@app.put("/api/incidents/{incident_id}/checklist")
def update_checklist_step(incident_id: str, payload: ChecklistUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    ts = now_iso() if payload.completed else None
    cursor.execute("""
        UPDATE incident_checklist
        SET completed = ?, completed_at = ?, completed_by = ?
        WHERE incident_id = ? AND step_id = ?
    """, (int(payload.completed), ts, payload.admin_name if payload.completed else None, incident_id, payload.step_id))

    conn.commit()
    conn.close()

    return {"status": "SUCCESS", "step_id": payload.step_id, "completed": payload.completed}

# =========================================================================
# 8. 6-HOUR CERT-In REPORTING COUNTDOWN
# =========================================================================

@app.get("/api/countdown")
def get_cert_in_countdown():
    """
    Returns live countdown calculated directly from the database persisted notice time.
    Refreshing or restarting does not reset the countdown.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Grab the active confirmed reportable incident
    cursor.execute("""
        SELECT * FROM security_incidents 
        WHERE is_reportable = 1 AND status IN ('CONFIRMED_BREACH', 'UNDER_INVESTIGATION')
        ORDER BY created_at DESC LIMIT 1
    """)
    inc_row = cursor.fetchone()

    if not inc_row or not inc_row['reporting_deadline']:
        conn.close()
        return {
            "has_active_countdown": False,
            "incident_id": None,
            "notice_time": None,
            "reporting_deadline": None,
            "remaining_seconds": 0,
            "remaining_hours": 0,
            "remaining_minutes": 0,
            "reporting_status": "6 Hours Available",
            "is_expired": False
        }

    inc = dict(inc_row)
    deadline_str = inc['reporting_deadline']
    notice_str = inc['notice_time']

    deadline_dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
    now_dt = datetime.now(timezone.utc)

    delta = deadline_dt - now_dt
    remaining_total_secs = max(0, int(delta.total_seconds()))
    is_expired = delta.total_seconds() <= 0

    rem_hours = remaining_total_secs // 3600
    rem_mins = (remaining_total_secs % 3600) // 60
    rem_secs = remaining_total_secs % 60

    if is_expired:
        status_label = "Deadline Passed"
    elif rem_hours < 1:
        status_label = "Deadline Approaching"
    else:
        status_label = "Time Running"

    # Update database record status if needed
    cursor.execute("UPDATE security_incidents SET cert_in_status = ? WHERE incident_id = ?", (status_label, inc['incident_id']))
    conn.commit()
    conn.close()

    return {
        "has_active_countdown": True,
        "incident_id": inc['incident_id'],
        "title": inc['title'],
        "notice_time": notice_str,
        "reporting_deadline": deadline_str,
        "remaining_seconds": remaining_total_secs,
        "remaining_hours": rem_hours,
        "remaining_minutes": rem_mins,
        "remaining_secs_part": rem_secs,
        "reporting_status": status_label,
        "is_expired": is_expired
    }

# =========================================================================
# 9. PDF REPORT GENERATION
# =========================================================================

@app.get("/api/reports/incident/{incident_id}/pdf")
def download_incident_pdf(incident_id: str):
    pdf_buffer = generate_incident_pdf(incident_id)
    headers = {
        "Content-Disposition": f"attachment; filename=Incident_Report_{incident_id}.pdf"
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

# =========================================================================
# 10. SYSTEM SETTINGS & AUDIT LOGS
# =========================================================================

@app.get("/api/settings")
def get_settings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT setting_key, setting_value FROM system_settings")
    settings = {r['setting_key']: r['setting_value'] for r in cursor.fetchall()}
    conn.close()
    return settings

@app.post("/api/settings")
def update_setting(payload: SettingUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    """, (payload.setting_key, payload.setting_value))
    conn.commit()
    conn.close()
    return {"status": "SUCCESS", "setting_key": payload.setting_key, "setting_value": payload.setting_value}

@app.get("/api/admin-actions")
def get_admin_actions(limit: int = 50):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_actions ORDER BY timestamp DESC LIMIT ?", (limit,))
    actions = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return actions

# =========================================================================
# 11. STATIC FRONTEND SERVING (For production or unified single-port runs)
# =========================================================================

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

