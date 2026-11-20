import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from database import get_connection, now_iso
from rules_engine import analyze_api_activity
from seed_data import seed_baseline_data

def run_single_simulation(scenario_id: int) -> Dict[str, Any]:
    """Runs an individual simulation scenario (1-8)."""
    now = datetime.now(timezone.utc)
    ts = now.isoformat()

    if scenario_id == 1:
        # Scenario 1: Normal API Activity
        res = analyze_api_activity(
            key_id="KEY-101",
            source_ip="192.168.10.15",
            connected_system="LedgerOne",
            activity_name="Standard Vendor Invoice Query",
            permission_used="READ_DATA",
            records_accessed=25,
            custom_timestamp=ts
        )
        return {
            "scenario": 1,
            "title": "Normal API Activity",
            "description": "Standard API request executed from an approved IP with authorized read permission.",
            "result": res
        }

    elif scenario_id == 2:
        # Scenario 2: Shadow / Unregistered API Key
        res = analyze_api_activity(
            key_id="KEY-999-SHADOW",
            source_ip="198.51.100.77",
            connected_system="SSO",
            activity_name="Unauthenticated Directory Scan",
            permission_used="READ_DATA",
            records_accessed=10,
            custom_timestamp=ts
        )
        return {
            "scenario": 2,
            "title": "Shadow API Key Probing",
            "description": "Activity detected using an unregistered API key not present in the inventory.",
            "result": res
        }

    elif scenario_id == 3:
        # Scenario 3: Shared API Key Misuse
        # Generate requests from two unexpected external IPs for KEY-106
        res1 = analyze_api_activity(
            key_id="KEY-106",
            source_ip="185.220.101.5",
            connected_system="HelpDeskr",
            activity_name="Offshore Support Session",
            permission_used="READ_DATA",
            records_accessed=15,
            custom_timestamp=(now - timedelta(minutes=2)).isoformat()
        )
        res2 = analyze_api_activity(
            key_id="KEY-106",
            source_ip="45.33.32.156",
            connected_system="HelpDeskr",
            activity_name="Simultaneous Remote Query",
            permission_used="READ_DATA",
            records_accessed=20,
            custom_timestamp=ts
        )
        return {
            "scenario": 3,
            "title": "Shared API Key Misuse",
            "description": "KEY-106 used simultaneously across multiple unexpected external IP addresses.",
            "result": res2
        }

    elif scenario_id == 4:
        # Scenario 4: Over-Privileged Key Misuse
        res = analyze_api_activity(
            key_id="KEY-103",
            source_ip="172.16.50.12",
            connected_system="LedgerOne",
            activity_name="Query Executive Salary Ledger",
            permission_used="ACCESS_FINANCIAL_RECORDS",
            records_accessed=80,
            custom_timestamp=ts
        )
        return {
            "scenario": 4,
            "title": "Over-Privileged Key Misuse",
            "description": "Third-party connector KEY-103 used excessive permissions beyond expected role scope.",
            "result": res
        }

    elif scenario_id == 5:
        # Scenario 5: Unapproved IP Access
        res = analyze_api_activity(
            key_id="KEY-101",
            source_ip="103.21.244.11", # Unapproved IP
            connected_system="LedgerOne",
            activity_name="Remote Vendor Ledger Sync",
            permission_used="READ_DATA",
            records_accessed=40,
            custom_timestamp=ts
        )
        return {
            "scenario": 5,
            "title": "Unapproved IP Access",
            "description": "Internal billing key KEY-101 accessed from unapproved external IP 103.21.244.11.",
            "result": res
        }

    elif scenario_id == 6:
        # Scenario 6: Bulk Data Access
        res = analyze_api_activity(
            key_id="KEY-104",
            source_ip="10.0.1.100",
            connected_system="BlueVault",
            activity_name="Bulk Manifest & Document Dump",
            permission_used="READ_DATA",
            records_accessed=12500, # Threshold is 500
            custom_timestamp=ts
        )
        return {
            "scenario": 6,
            "title": "Unusual Bulk Data Access",
            "description": "KEY-104 extracted 12,500 records in a single request, heavily exceeding normal baseline.",
            "result": res
        }

    elif scenario_id == 7:
        # Scenario 7: Revoked Key Usage
        # Check if any key is currently REVOKED or use KEY-103
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT key_id FROM api_keys WHERE status = 'REVOKED' LIMIT 1")
        rev_row = cursor.fetchone()
        
        target_rev_key = rev_row['key_id'] if rev_row else "KEY-103"
        if not rev_row:
            # Temporarily revoke KEY-103 for the demonstration test
            cursor.execute("UPDATE api_keys SET status = 'REVOKED' WHERE key_id = 'KEY-103'")
            conn.commit()

        conn.close()

        res = analyze_api_activity(
            key_id=target_rev_key,
            source_ip="185.220.101.5",
            connected_system="LedgerOne",
            activity_name="Unauthorized Exfiltration Attempt Post-Revocation",
            permission_used="READ_DATA",
            records_accessed=50,
            custom_timestamp=ts
        )
        return {
            "scenario": 7,
            "title": "Revoked Key Usage Detected",
            "description": f"Activity attempted with revoked key {target_rev_key}. Generated critical alert.",
            "result": res
        }

    elif scenario_id == 8:
        # Scenario 8: Suspicious Data Modification
        res = analyze_api_activity(
            key_id="KEY-103",
            source_ip="172.16.50.12",
            connected_system="LedgerOne",
            activity_name="Alter Vendor Bank Routing Coordinates",
            permission_used="MODIFY_RECORDS",
            records_accessed=15,
            custom_timestamp=ts
        )
        return {
            "scenario": 8,
            "title": "Suspicious Data Modification",
            "description": "Unauthorized modification of vendor payment routing accounts in LedgerOne.",
            "result": res
        }

    else:
        raise ValueError(f"Unknown scenario ID: {scenario_id}")


def run_complete_breach_simulation() -> Dict[str, Any]:
    """
    Executes the complete end-to-end cybersecurity breach sequence based on
    the Harbor & Finch Freight case study.
    Generates correlated alerts, establishes confirmed security incident,
    identifies all involved API keys, begins CERT-In 6-hour reporting countdown,
    and initializes response checklist.
    """
    now = datetime.now(timezone.utc)
    base_time = now - timedelta(minutes=15)

    events_summary = []

    # 1. Normal activity (KEY-101)
    t1 = (base_time + timedelta(minutes=1)).isoformat()
    r1 = analyze_api_activity(
        "KEY-101", "192.168.10.15", "LedgerOne",
        "Normal Scheduled Billing Sync", "READ_DATA", 35, t1
    )
    events_summary.append({"step": 1, "name": "Normal API Activity", "key": "KEY-101", "status": r1['status']})

    # 2. Shadow API key reconnaissance
    t2 = (base_time + timedelta(minutes=3)).isoformat()
    r2 = analyze_api_activity(
        "KEY-SHADOW-X", "198.51.100.99", "SSO",
        "Shadow Key Reconnaissance Scan", "READ_DATA", 1, t2
    )
    events_summary.append({"step": 2, "name": "Shadow Key Detection", "key": "KEY-SHADOW-X", "status": r2['status']})

    # 3. Shared API key misuse (KEY-106 on HelpDeskr)
    t3 = (base_time + timedelta(minutes=5)).isoformat()
    r3 = analyze_api_activity(
        "KEY-106", "185.220.101.5", "HelpDeskr",
        "Offshore Ticket Exfiltration", "READ_DATA", 120, t3
    )
    events_summary.append({"step": 3, "name": "Shared Key Anomalous Origin", "key": "KEY-106", "status": r3['status']})

    # 4. Over-privileged key exploration (KEY-103)
    t4 = (base_time + timedelta(minutes=7)).isoformat()
    r4 = analyze_api_activity(
        "KEY-103", "172.16.50.12", "LedgerOne",
        "Access Sensitive Financial Ledgers", "ACCESS_FINANCIAL_RECORDS", 450, t4
    )
    events_summary.append({"step": 4, "name": "Over-privileged Access", "key": "KEY-103", "status": r4['status']})

    # 5. Unapproved IP access (KEY-103 from foreign attacker staging IP)
    t5 = (base_time + timedelta(minutes=9)).isoformat()
    r5 = analyze_api_activity(
        "KEY-103", "185.220.101.5", "LedgerOne",
        "Remote External Session Connection", "READ_DATA", 80, t5
    )
    events_summary.append({"step": 5, "name": "Unapproved IP Incursion", "key": "KEY-103", "status": r5['status']})

    # 6. Massive bulk data access (KEY-103 exfiltrates 14,800 records from LedgerOne)
    t6 = (base_time + timedelta(minutes=11)).isoformat()
    r6 = analyze_api_activity(
        "KEY-103", "185.220.101.5", "LedgerOne",
        "Massive Ledger Data Exfiltration", "READ_DATA", 14800, t6
    )
    events_summary.append({"step": 6, "name": "Massive Bulk Data Exfiltration", "key": "KEY-103", "status": r6['status']})

    # 7. Suspicious data modification (KEY-103 alters vendor bank routing)
    t7 = (base_time + timedelta(minutes=13)).isoformat()
    r7 = analyze_api_activity(
        "KEY-103", "185.220.101.5", "LedgerOne",
        "Modify Vendor Bank Routing Coordinates", "MODIFY_RECORDS", 12, t7
    )
    events_summary.append({"step": 7, "name": "Tampering of Payment Routing", "key": "KEY-103", "status": r7['status']})

    # Establish Security Incident in Database
    conn = get_connection()
    cursor = conn.cursor()

    incident_id = "INC-2026-BREACH-01"
    detection_time = (base_time + timedelta(minutes=5)).isoformat()
    notice_time = now.isoformat()
    deadline_time = (now + timedelta(hours=6)).isoformat()

    title = "Harbor & Finch Freight - API Key Compromise and Financial Exfiltration"
    description = (
        "High-severity security breach: Unregistered shadow key activity on SSO followed by compromise of third-party "
        "connector KEY-103 from unapproved foreign IP 185.220.101.5. Attacker abused over-privileged permissions to exfiltrate "
        "14,800 vendor/financial records and altered vendor payment routing coordinates in LedgerOne. Corroborated by Evidence E13 "
        "(support team chat logs) and E16 (external vendor notice)."
    )

    # Insert or update the incident
    cursor.execute("""
        INSERT OR REPLACE INTO security_incidents (
            incident_id, title, description, status, created_at, notice_time,
            reporting_deadline, is_reportable, cert_in_status, evidence_reference
        ) VALUES (?, ?, ?, 'CONFIRMED_BREACH', ?, ?, ?, 1, 'Time Running', 'Evidence E13 & E16')
    """, (incident_id, title, description, detection_time, notice_time, deadline_time))

    # Link all involved API keys with evidence details
    cursor.execute("DELETE FROM incident_related_keys WHERE incident_id = ?", (incident_id,))
    
    involved_keys = [
        (
            incident_id, "KEY-103",
            "Primary compromised key. Third-party software key used from foreign IP 185.220.101.5 to exfiltrate 14,800 financial records and alter vendor banking details.",
            15262, json.dumps(["READ_DATA", "ACCESS_FINANCIAL_RECORDS", "MODIFY_RECORDS"]),
            json.dumps(["172.16.50.12", "185.220.101.5"]), json.dumps(["LedgerOne", "TallyBridge Connect"])
        ),
        (
            incident_id, "KEY-106",
            "Shared key anomaly. Human-operated internal key accessed concurrently from unexpected foreign IP 185.220.101.5 during night shift.",
            120, json.dumps(["READ_DATA"]),
            json.dumps(["192.168.20.45", "185.220.101.5"]), json.dumps(["HelpDeskr"])
        ),
        (
            incident_id, "KEY-SHADOW-X",
            "Unregistered shadow API key observed probing SSO authentication endpoints without prior administrative approval.",
            1, json.dumps(["READ_DATA"]),
            json.dumps(["198.51.100.99"]), json.dumps(["SSO"])
        )
    ]

    for ik in involved_keys:
        cursor.execute("""
            INSERT INTO incident_related_keys (
                incident_id, key_id, reason_for_involvement, records_accessed,
                permissions_used, ips_used, systems_affected
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ik)

    # Associate alerts with this incident
    cursor.execute("""
        UPDATE security_alerts 
        SET related_incident_id = ? 
        WHERE timestamp >= ?
    """, (incident_id, (base_time).isoformat()))

    # Build chronological Incident Timeline
    cursor.execute("DELETE FROM incident_timeline WHERE incident_id = ?", (incident_id,))

    timeline_events = [
        (incident_id, (base_time + timedelta(minutes=1)).isoformat(), "Baseline Activity Recorded", "Standard API activity observed on LedgerOne by key KEY-101.", "DETECTION", "System Monitoring"),
        (incident_id, (base_time + timedelta(minutes=3)).isoformat(), "Shadow Key Probing Detected", "Unregistered API key KEY-SHADOW-X detected probing SSO from 198.51.100.99.", "ALERT", "Detection Engine"),
        (incident_id, (base_time + timedelta(minutes=5)).isoformat(), "Shared Key Boundary Breach", "KEY-106 observed originating from unapproved foreign IP 185.220.101.5.", "ALERT", "Detection Engine"),
        (incident_id, (base_time + timedelta(minutes=7)).isoformat(), "Over-Privileged Access Flagged", "KEY-103 invoked ACCESS_FINANCIAL_RECORDS which exceeds role expectations.", "ALERT", "Detection Engine"),
        (incident_id, (base_time + timedelta(minutes=9)).isoformat(), "Direct Unapproved IP Breach", "KEY-103 accessed LedgerOne from unapproved external IP 185.220.101.5.", "ALERT", "Detection Engine"),
        (incident_id, (base_time + timedelta(minutes=11)).isoformat(), "Massive Data Exfiltration Alert", "KEY-103 extracted 14,800 vendor and financial records from LedgerOne.", "ALERT", "Detection Engine"),
        (incident_id, (base_time + timedelta(minutes=13)).isoformat(), "Critical Payment Tampering Flagged", "KEY-103 altered vendor payment routing coordinates in LedgerOne.", "ALERT", "Detection Engine"),
        (incident_id, notice_time, "Incident Formally Confirmed & Notice Recorded", "Security team corroborated alerts with Evidence E13 chat records and verified breach. 6-Hour CERT-In reporting window triggered.", "CONFIRMATION", "SecOps Admin (Tensor Terminators)")
    ]

    for te in timeline_events:
        cursor.execute("""
            INSERT INTO incident_timeline (incident_id, timestamp, event_title, event_description, event_type, actor)
            VALUES (?, ?, ?, ?, ?, ?)
        """, te)

    # Initialize Incident Checklist
    cursor.execute("DELETE FROM incident_checklist WHERE incident_id = ?", (incident_id,))
    checklist_steps = [
        ("step_1", "Identify affected API keys and shadow keys", 1, notice_time, "System Auto-Analysis"),
        ("step_2", "Check key owners, systems and role permissions", 1, notice_time, "System Auto-Analysis"),
        ("step_3", "Analyze approved vs actual source IP addresses", 1, notice_time, "System Auto-Analysis"),
        ("step_4", "Determine affected systems (LedgerOne, HelpDeskr, SSO)", 1, notice_time, "System Auto-Analysis"),
        ("step_5", "Review related security alerts and corroborating evidence (E13 & E16)", 0, None, None),
        ("step_6", "Revoke or rotate compromised keys (KEY-103 containment)", 0, None, None),
        ("step_7", "Secure forensic evidence and audit logs", 0, None, None),
        ("step_8", "Prepare and generate final incident report", 0, None, None),
        ("step_9", "Submit prescribed cyber incident report before 6-hour CERT-In deadline", 0, None, None)
    ]

    for step in checklist_steps:
        cursor.execute("""
            INSERT INTO incident_checklist (incident_id, step_id, step_title, completed, completed_at, completed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (incident_id, step[0], step[1], step[2], step[3], step[4]))

    # Record Admin Action
    cursor.execute("""
        INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
        VALUES (?, 'SecOps Admin', 'BREACH_SIMULATION', 'INC-2026-BREACH-01', 'Executed complete simulated attack scenario and confirmed incident.')
    """, (now_iso(),))

    conn.commit()
    conn.close()

    return {
        "status": "SUCCESS",
        "incident_id": incident_id,
        "total_events_generated": 7,
        "suspicious_activities": 6,
        "api_keys_involved": ["KEY-103", "KEY-106", "KEY-SHADOW-X"],
        "affected_systems": ["LedgerOne", "HelpDeskr", "SSO", "TallyBridge Connect"],
        "alerts_generated": 6,
        "incident_status": "CONFIRMED_BREACH",
        "notice_time": notice_time,
        "reporting_deadline": deadline_time,
        "countdown_hours_remaining": 6.0,
        "events": events_summary
    }

def reset_simulation_data() -> Dict[str, Any]:
    """Resets the demo environment back to baseline 10 keys and clean monitoring state."""
    seed_baseline_data()
    return {
        "status": "SUCCESS",
        "message": "Demo environment safely reset to baseline 10 registered API keys."
    }
