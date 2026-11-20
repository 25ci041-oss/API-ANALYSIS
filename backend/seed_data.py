import json
from datetime import datetime, timezone, timedelta
from database import get_connection, init_db, now_iso

def seed_baseline_data():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Clear previous simulation / run data for a clean baseline of 10 keys
    cursor.execute("DELETE FROM incident_checklist")
    cursor.execute("DELETE FROM incident_timeline")
    cursor.execute("DELETE FROM incident_related_keys")
    cursor.execute("DELETE FROM security_incidents")
    cursor.execute("DELETE FROM security_alerts")
    cursor.execute("DELETE FROM api_activity_logs")
    cursor.execute("DELETE FROM key_change_history")
    cursor.execute("DELETE FROM admin_actions")
    cursor.execute("DELETE FROM api_keys")

    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(days=1)).isoformat()
    two_days_ago = (now - timedelta(days=2)).isoformat()
    three_days_ago = (now - timedelta(days=3)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    thirty_days_future = (now + timedelta(days=30)).strftime("%Y-%m-%d")
    seven_days_future = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    sixty_days_future = (now + timedelta(days=60)).strftime("%Y-%m-%d")

    # 10 Fictional API Keys inspired by Harbor & Finch Freight case study:
    initial_keys = [
        (
            "KEY-101",
            "LedgerOne Billing Sync",
            "Finance Dept / Rajesh Nair",
            "INTERNAL",
            "SOFTWARE_CONTROLLED",
            "LedgerOne",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["192.168.10.15"]),
            "192.168.10.15",
            json.dumps(["LedgerOne"]),
            json.dumps(["READ_DATA", "ACCESS_FINANCIAL_RECORDS"]),
            json.dumps(["READ_DATA", "ACCESS_FINANCIAL_RECORDS"]),
            1420,
            42600,
            500,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0, # not shared
            0, # not overprivileged
            "Core billing synchronization service between LedgerOne ERP and internal warehouse ledger."
        ),
        (
            "KEY-102",
            "HelpDeskr Customer Portal",
            "Pooja Sharma (Support Lead)",
            "INTERNAL",
            "HUMAN_CONTROLLED",
            "HelpDeskr",
            seven_days_ago,
            sixty_days_future,
            three_days_ago,
            "ACTIVE",
            json.dumps(["192.168.20.40"]),
            "192.168.20.40",
            json.dumps(["HelpDeskr"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            640,
            3200,
            200,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "Customer support portal lookup key for dispatch issues and cargo inquiries."
        ),
        (
            "KEY-103",
            "TallyBridge Vendor Sync",
            "LogiCorp Logistics (Third-Party Partner)",
            "THIRD_PARTY",
            "SOFTWARE_CONTROLLED",
            "TallyBridge Connect",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["172.16.50.12"]),
            "172.16.50.12",
            json.dumps(["TallyBridge Connect", "LedgerOne"]),
            # Assigned permissions include MODIFY_RECORDS, ACCESS_FINANCIAL_RECORDS which are excessive!
            json.dumps(["READ_DATA", "WRITE_DATA", "MODIFY_RECORDS", "ACCESS_FINANCIAL_RECORDS"]),
            json.dumps(["READ_DATA"]), # Expected baseline is only READ_DATA
            890,
            8900,
            300,
            "NEEDS_REVIEW", # Flagged as over-privileged
            seven_days_ago,
            seven_days_future,
            0,
            1, # OVERPRIVILEGED
            "Third-party vendor data bridge. Over-privileged: holds MODIFY_RECORDS and ACCESS_FINANCIAL_RECORDS."
        ),
        (
            "KEY-104",
            "BlueVault Storage Agent",
            "Infra Team / Amit Verma",
            "INTERNAL",
            "SOFTWARE_CONTROLLED",
            "BlueVault",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["10.0.1.100", "10.0.1.101"]),
            "10.0.1.100",
            json.dumps(["BlueVault"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            2100,
            15400,
            500,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            1, # Shared across two approved cluster node IPs
            0,
            "Internal document archival agent cluster for shipping manifests."
        ),
        (
            "KEY-105",
            "SSO Directory Connector",
            "Identity Team / Sunita Rao",
            "INTERNAL",
            "SOFTWARE_CONTROLLED",
            "SSO",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["10.0.2.50"]),
            "10.0.2.50",
            json.dumps(["SSO"]),
            json.dumps(["READ_DATA"]),
            json.dumps(["READ_DATA"]),
            3800,
            3800,
            100,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "Single Sign-On authentication directory gateway."
        ),
        (
            "KEY-106",
            "Support Ops Dashboard",
            "Rohan Deshmukh (Support Shift Lead)",
            "INTERNAL",
            "HUMAN_CONTROLLED",
            "HelpDeskr",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["192.168.20.45", "192.168.20.46"]),
            "192.168.20.45",
            json.dumps(["HelpDeskr"]),
            json.dumps(["READ_DATA"]),
            json.dumps(["READ_DATA"]),
            1150,
            5750,
            250,
            "NEEDS_REVIEW",
            seven_days_ago,
            seven_days_future,
            1, # Shared across multiple shift desk workstations
            0,
            "Helpdesk operations dashboard key. Shared across shift desks; subject of Evidence E13 chat."
        ),
        (
            "KEY-107",
            "Vendor Audit Service",
            "Apex Auditing Partners (Third-Party)",
            "THIRD_PARTY",
            "HUMAN_CONTROLLED",
            "LedgerOne",
            seven_days_ago,
            sixty_days_future,
            three_days_ago,
            "ACTIVE",
            json.dumps(["198.51.100.22"]),
            "198.51.100.22",
            json.dumps(["LedgerOne"]),
            json.dumps(["READ_DATA", "ACCESS_FINANCIAL_RECORDS"]),
            json.dumps(["READ_DATA", "ACCESS_FINANCIAL_RECORDS"]),
            320,
            9600,
            400,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "Quarterly external accounting auditor access key."
        ),
        (
            "KEY-108",
            "BlueVault Backup Runner",
            "Backup Ops / Sanjay Mehta",
            "INTERNAL",
            "SOFTWARE_CONTROLLED",
            "BlueVault",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["10.0.3.15"]),
            "10.0.3.15",
            json.dumps(["BlueVault"]),
            json.dumps(["READ_DATA"]),
            json.dumps(["READ_DATA"]),
            520,
            10400,
            500,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "Nightly automated snapshot backup service for storage volumes."
        ),
        (
            "KEY-109",
            "Freight Tracking Gateway",
            "Oceanic Carriers Inc (Third-Party)",
            "THIRD_PARTY",
            "SOFTWARE_CONTROLLED",
            "TallyBridge Connect",
            seven_days_ago,
            sixty_days_future,
            one_day_ago,
            "ACTIVE",
            json.dumps(["203.0.113.88"]),
            "203.0.113.88",
            json.dumps(["TallyBridge Connect"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            750,
            3750,
            250,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "Container telematics and GPS status push feed from shipping vessels."
        ),
        (
            "KEY-110",
            "Customer Feedback Collector",
            "Marketing / Neha Kapoor",
            "INTERNAL",
            "HUMAN_CONTROLLED",
            "HelpDeskr",
            seven_days_ago,
            sixty_days_future,
            two_days_ago,
            "ACTIVE",
            json.dumps(["192.168.20.55"]),
            "192.168.20.55",
            json.dumps(["HelpDeskr"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            json.dumps(["READ_DATA", "WRITE_DATA"]),
            210,
            420,
            100,
            "REVIEWED",
            seven_days_ago,
            thirty_days_future,
            0,
            0,
            "NPS feedback collection webhook integration."
        )
    ]

    for k in initial_keys:
        cursor.execute("""
        INSERT INTO api_keys (
            key_id, name, owner_name, ownership_type, control_type, connected_system,
            created_date, expiry_date, last_used_at, status, approved_ips, last_used_ip,
            allowed_systems, allowed_permissions, expected_permissions, total_requests,
            total_records_accessed, normal_records_threshold, review_status, last_reviewed_at,
            next_review_date, is_shared, is_overprivileged, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, k)

        # Record baseline key change history
        cursor.execute("""
        INSERT INTO key_change_history (timestamp, key_id, action_type, admin_name, details)
        VALUES (?, ?, 'ADDED', 'System Initializer', 'Registered during baseline inventory establishment')
        """, (seven_days_ago, k[0]))

    # Seed a few baseline safe activity logs
    baseline_activities = [
        (one_day_ago, "KEY-101", "192.168.10.15", "LedgerOne", "Routine Vendor Payment Query", "READ_DATA", 45, "SAFE", "Legitimate automated query from approved subnet."),
        (one_day_ago, "KEY-105", "10.0.2.50", "SSO", "Directory Auth Check", "READ_DATA", 12, "SAFE", "Standard employee SSO credential validation."),
        (one_day_ago, "KEY-104", "10.0.1.100", "BlueVault", "Manifest Archival", "WRITE_DATA", 30, "SAFE", "Approved cluster node uploaded storage manifest."),
        (one_day_ago, "KEY-102", "192.168.20.40", "HelpDeskr", "Ticket Status Update", "WRITE_DATA", 5, "SAFE", "Support agent updated delivery status ticket.")
    ]

    for b in baseline_activities:
        cursor.execute("""
        INSERT INTO api_activity_logs (
            timestamp, key_id, source_ip, connected_system, activity_name, permission_used,
            records_accessed, status, is_unregistered, is_unapproved_ip, is_overprivileged,
            is_bulk_data, is_shared_misuse, is_revoked_usage, explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?)
        """, b)

    cursor.execute("""
    INSERT INTO admin_actions (timestamp, admin_name, action, target, details)
    VALUES (?, 'SecOps Admin', 'SYSTEM_INIT', 'API Inventory', 'Baseline inventory of 10 keys initialized successfully')
    """, (now_iso(),))

    conn.commit()
    conn.close()
    print("Baseline seed complete: Exactly 10 API keys loaded.")

if __name__ == "__main__":
    seed_baseline_data()
