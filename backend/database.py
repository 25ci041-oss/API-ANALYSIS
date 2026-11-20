import sqlite3
import json
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

DB_FILE = os.environ.get("DB_FILE", os.path.join(os.path.dirname(__file__), "api_security.db"))

def get_connection():
    conn = sqlite3.connect(DB_FILE, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. API Keys table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_keys (
        key_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        ownership_type TEXT NOT NULL CHECK(ownership_type IN ('INTERNAL', 'THIRD_PARTY')),
        control_type TEXT NOT NULL CHECK(control_type IN ('HUMAN_CONTROLLED', 'SOFTWARE_CONTROLLED')),
        connected_system TEXT NOT NULL,
        created_date TEXT NOT NULL,
        expiry_date TEXT,
        last_used_at TEXT,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE', 'REVOKED', 'EXPIRED')),
        approved_ips TEXT NOT NULL, -- JSON array of strings
        last_used_ip TEXT,
        allowed_systems TEXT NOT NULL, -- JSON array
        allowed_permissions TEXT NOT NULL, -- JSON array
        expected_permissions TEXT NOT NULL, -- JSON array (baseline role permissions)
        total_requests INTEGER DEFAULT 0,
        total_records_accessed INTEGER DEFAULT 0,
        normal_records_threshold INTEGER DEFAULT 500,
        review_status TEXT NOT NULL DEFAULT 'REVIEWED' CHECK(review_status IN ('NEEDS_REVIEW', 'UNDER_REVIEW', 'REVIEWED')),
        last_reviewed_at TEXT,
        next_review_date TEXT,
        is_shared BOOLEAN DEFAULT 0,
        is_overprivileged BOOLEAN DEFAULT 0,
        notes TEXT
    );
    """)

    # 2. Activity Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        key_id TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        connected_system TEXT NOT NULL,
        activity_name TEXT NOT NULL,
        permission_used TEXT NOT NULL,
        records_accessed INTEGER DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('SAFE', 'WARNING', 'SUSPICIOUS', 'CRITICAL')),
        is_unregistered BOOLEAN DEFAULT 0,
        is_unapproved_ip BOOLEAN DEFAULT 0,
        is_overprivileged BOOLEAN DEFAULT 0,
        is_bulk_data BOOLEAN DEFAULT 0,
        is_shared_misuse BOOLEAN DEFAULT 0,
        is_revoked_usage BOOLEAN DEFAULT 0,
        explanation TEXT NOT NULL
    );
    """)

    # 3. Security Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE NOT NULL,
        timestamp TEXT NOT NULL,
        key_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('WARNING', 'HIGH_RISK', 'CRITICAL')),
        source_ip TEXT NOT NULL,
        connected_system TEXT NOT NULL,
        details TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
        related_incident_id TEXT
    );
    """)

    # 4. Security Incidents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_incidents (
        incident_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('SUSPICIOUS_ACTIVITY', 'UNDER_INVESTIGATION', 'CONFIRMED_BREACH', 'FALSE_POSITIVE', 'RESOLVED')),
        created_at TEXT NOT NULL,
        notice_time TEXT,
        reporting_deadline TEXT,
        is_reportable BOOLEAN DEFAULT 0,
        cert_in_status TEXT DEFAULT '6 Hours Available',
        evidence_reference TEXT,
        resolved_at TEXT
    );
    """)

    # 5. Incident Related Keys table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_related_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT NOT NULL,
        key_id TEXT NOT NULL,
        reason_for_involvement TEXT NOT NULL,
        records_accessed INTEGER DEFAULT 0,
        permissions_used TEXT,
        ips_used TEXT,
        systems_affected TEXT,
        FOREIGN KEY (incident_id) REFERENCES security_incidents(incident_id) ON DELETE CASCADE
    );
    """)

    # 6. Incident Timeline table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        event_title TEXT NOT NULL,
        event_description TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT DEFAULT 'System',
        FOREIGN KEY (incident_id) REFERENCES security_incidents(incident_id) ON DELETE CASCADE
    );
    """)

    # 7. Key Change History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS key_change_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        key_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        details TEXT NOT NULL
    );
    """)

    # 8. Admin Actions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL,
        details TEXT NOT NULL
    );
    """)

    # 9. Incident Response Checklist table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        step_title TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        completed_at TEXT,
        completed_by TEXT,
        UNIQUE(incident_id, step_id),
        FOREIGN KEY (incident_id) REFERENCES security_incidents(incident_id) ON DELETE CASCADE
    );
    """)

    # 10. System Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL
    );
    """)

    # Insert default settings if not exists
    cursor.execute("INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES ('bulk_data_threshold', '1000');")
    cursor.execute("INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES ('cert_in_deadline_hours', '6');")
    cursor.execute("INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES ('critical_review_interval_days', '7');")
    cursor.execute("INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES ('normal_review_interval_days', '30');")
    cursor.execute("INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES ('current_admin', 'SecOps Admin (Tensor Terminators)');")

    conn.commit()
    conn.close()

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
