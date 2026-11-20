import json
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from database import get_connection, now_iso

def analyze_api_activity(
    key_id: str,
    source_ip: str,
    connected_system: str,
    activity_name: str,
    permission_used: str,
    records_accessed: int = 1,
    custom_timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates an incoming API activity against security rules and boundaries.
    Saves the activity log and triggers security alerts when anomalies are found.
    """
    conn = get_connection()
    cursor = conn.cursor()
    ts = custom_timestamp or now_iso()

    # Fetch system settings
    cursor.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'bulk_data_threshold'")
    row = cursor.fetchone()
    bulk_threshold = int(row['setting_value']) if row else 1000

    # Look up key in registered database
    cursor.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
    key_row = cursor.fetchone()

    is_unregistered = False
    is_revoked_usage = False
    is_unapproved_ip = False
    is_overprivileged = False
    is_bulk_data = False
    is_shared_misuse = False
    is_suspicious_modification = False

    reasons = []
    status = "SAFE"
    alerts_to_generate = []

    if not key_row:
        # RULE 1: Unregistered / Shadow Key
        is_unregistered = True
        status = "CRITICAL"
        reasons.append(f"Unregistered API key {key_id} detected in activity on system '{connected_system}'. Please verify.")
        alerts_to_generate.append({
            "alert_type": "SHADOW_KEY",
            "severity": "CRITICAL",
            "details": f"Shadow API key '{key_id}' made unauthenticated requests to '{connected_system}' from IP {source_ip}."
        })
    else:
        key_data = dict(key_row)
        approved_ips = json.loads(key_data.get("approved_ips") or "[]")
        allowed_permissions = json.loads(key_data.get("allowed_permissions") or "[]")
        expected_permissions = json.loads(key_data.get("expected_permissions") or "[]")
        key_status = key_data.get("status")
        normal_threshold = key_data.get("normal_records_threshold", 500)

        # RULE 2: Revoked Key Usage
        if key_status == "REVOKED":
            is_revoked_usage = True
            status = "CRITICAL"
            reasons.append(f"Critical violation: Revoked API key {key_id} attempted access from IP {source_ip}.")
            alerts_to_generate.append({
                "alert_type": "REVOKED_KEY_USAGE",
                "severity": "CRITICAL",
                "details": f"Revoked API key '{key_id}' attempted activity '{activity_name}' on '{connected_system}'."
            })

        # RULE 3: IP Address Boundary Check
        if source_ip not in approved_ips:
            is_unapproved_ip = True
            if status != "CRITICAL":
                status = "SUSPICIOUS"
            approved_str = ", ".join(approved_ips) if approved_ips else "None"
            reasons.append(f"API key {key_id} was used from an unapproved IP address: {source_ip} (Approved IPs: {approved_str}).")
            alerts_to_generate.append({
                "alert_type": "UNAPPROVED_IP",
                "severity": "HIGH_RISK",
                "details": f"API key '{key_id}' breached IP boundary from unapproved source {source_ip}."
            })

        # RULE 4: Shared Key Misuse (Check past IP origins)
        cursor.execute("""
            SELECT DISTINCT source_ip FROM api_activity_logs 
            WHERE key_id = ? AND timestamp >= datetime('now', '-7 days')
        """, (key_id,))
        past_ips = [r['source_ip'] for r in cursor.fetchall()]
        all_observed_ips = set(past_ips + [source_ip])
        unapproved_observed = [ip for ip in all_observed_ips if ip not in approved_ips]

        if len(unapproved_observed) >= 2 or (len(all_observed_ips) > len(approved_ips) and len(all_observed_ips) >= 2):
            is_shared_misuse = True
            if status == "SAFE":
                status = "WARNING"
            reasons.append(f"API key {key_id} is being shared across multiple unexpected IP addresses ({', '.join(all_observed_ips)}).")
            # Mark key as shared in database
            cursor.execute("UPDATE api_keys SET is_shared = 1, review_status = 'NEEDS_REVIEW' WHERE key_id = ?", (key_id,))
            alerts_to_generate.append({
                "alert_type": "SHARED_KEY_MISUSE",
                "severity": "HIGH_RISK",
                "details": f"API key '{key_id}' shared across {len(all_observed_ips)} different IPs including unexpected origins."
            })

        # RULE 5: Over-Privileged Permissions Check
        # Check if permission used is outside expected baseline or outside allowed
        if permission_used not in expected_permissions:
            is_overprivileged = True
            if status == "SAFE":
                status = "WARNING"
            extra_perms = [p for p in allowed_permissions if p not in expected_permissions]
            reasons.append(
                f"API key {key_id} executed over-privileged action '{permission_used}'. "
                f"Assigned extra permissions: {', '.join(extra_perms) if extra_perms else permission_used} (Expected: {', '.join(expected_permissions)})."
            )
            cursor.execute("UPDATE api_keys SET is_overprivileged = 1, review_status = 'NEEDS_REVIEW' WHERE key_id = ?", (key_id,))
            alerts_to_generate.append({
                "alert_type": "OVERPRIVILEGED_KEY",
                "severity": "WARNING",
                "details": f"Over-privileged usage on '{connected_system}': key '{key_id}' invoked '{permission_used}' beyond expected role scope."
            })

        # RULE 6: Bulk Data Access Monitoring
        effective_threshold = min(normal_threshold, bulk_threshold)
        if records_accessed > effective_threshold:
            is_bulk_data = True
            if status != "CRITICAL":
                status = "SUSPICIOUS"
            reasons.append(
                f"Unusual bulk data access: {records_accessed:,} records requested (Normal baseline threshold: {effective_threshold:,} records)."
            )
            alerts_to_generate.append({
                "alert_type": "BULK_DATA_ACCESS",
                "severity": "HIGH_RISK",
                "details": f"Massive data retrieval: key '{key_id}' extracted {records_accessed:,} records from '{connected_system}'."
            })

        # RULE 7: Suspicious Data Modification
        if permission_used in ["MODIFY_RECORDS", "DELETE_RECORDS"] and ("vendor" in activity_name.lower() or "payment" in activity_name.lower() or "financial" in activity_name.lower() or connected_system == "LedgerOne"):
            is_suspicious_modification = True
            status = "CRITICAL"
            reasons.append(f"Suspicious critical modification: '{activity_name}' on system '{connected_system}'.")
            alerts_to_generate.append({
                "alert_type": "SUSPICIOUS_DATA_MODIFICATION",
                "severity": "CRITICAL",
                "details": f"Unauthorized modification of financial or vendor records in '{connected_system}' via '{activity_name}'."
            })

        # Update key usage counters if registered
        cursor.execute("""
            UPDATE api_keys 
            SET total_requests = total_requests + 1,
                total_records_accessed = total_records_accessed + ?,
                last_used_at = ?,
                last_used_ip = ?
            WHERE key_id = ?
        """, (records_accessed, ts, source_ip, key_id))

    explanation = " | ".join(reasons) if reasons else f"Routine authorized {activity_name} from approved IP {source_ip}."

    # Insert activity log
    cursor.execute("""
        INSERT INTO api_activity_logs (
            timestamp, key_id, source_ip, connected_system, activity_name, permission_used,
            records_accessed, status, is_unregistered, is_unapproved_ip, is_overprivileged,
            is_bulk_data, is_shared_misuse, is_revoked_usage, explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ts, key_id, source_ip, connected_system, activity_name, permission_used,
        records_accessed, status, int(is_unregistered), int(is_unapproved_ip),
        int(is_overprivileged), int(is_bulk_data), int(is_shared_misuse), int(is_revoked_usage),
        explanation
    ))

    # Insert generated alerts
    inserted_alerts = []
    for alert in alerts_to_generate:
        # Generate clean alert ID: ALT-<epoch_suffix>
        cursor.execute("SELECT COUNT(*) as count FROM security_alerts")
        alert_count = cursor.fetchone()['count'] + 1
        alert_id = f"ALT-{2000 + alert_count}"
        
        cursor.execute("""
            INSERT INTO security_alerts (
                alert_id, timestamp, key_id, alert_type, severity, source_ip,
                connected_system, details, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        """, (
            alert_id, ts, key_id, alert['alert_type'], alert['severity'],
            source_ip, connected_system, alert['details']
        ))
        inserted_alerts.append({
            "alert_id": alert_id,
            "alert_type": alert['alert_type'],
            "severity": alert['severity'],
            "details": alert['details']
        })

    conn.commit()
    conn.close()

    return {
        "status": status,
        "key_id": key_id,
        "explanation": explanation,
        "is_unregistered": is_unregistered,
        "is_unapproved_ip": is_unapproved_ip,
        "is_overprivileged": is_overprivileged,
        "is_bulk_data": is_bulk_data,
        "is_shared_misuse": is_shared_misuse,
        "is_revoked_usage": is_revoked_usage,
        "alerts_generated": inserted_alerts
    }
