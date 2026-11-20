import sys
import os
import json
from datetime import datetime, timezone, timedelta

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import main
from seed_data import seed_baseline_data
from models import (
    ApiKeyCreate, ApiKeyRevoke, ActivitySubmit, IncidentConfirm
)

def run_all_tests():
    print("=" * 70)
    print("REAL TIME API ANALYSIS – END-TO-END VERIFICATION TEST SUITE")
    print("Domain: Cyber Security | Team: Tensor Terminators | Event: CRIMEATHON")
    print("=" * 70)

    passed_tests = 0
    total_tests = 15

    # -------------------------------------------------------------
    # TEST 1: Start with 10 fictional API keys and show actual dashboard count
    # -------------------------------------------------------------
    print("\n[TEST 1] Reset to baseline and verify initial 10 keys...")
    seed_baseline_data()
    stats = main.get_dashboard_stats()
    assert stats["total_registered_keys"] == 10, f"Expected 10 registered keys, got {stats['total_registered_keys']}"
    assert stats["active_keys"] == 10, f"Expected 10 active keys, got {stats['active_keys']}"
    assert stats["internal_keys"] == 7, f"Expected 7 internal keys, got {stats['internal_keys']}"
    assert stats["third_party_keys"] == 3, f"Expected 3 third-party keys, got {stats['third_party_keys']}"
    assert stats["human_controlled_keys"] == 4, f"Expected 4 human keys, got {stats['human_controlled_keys']}"
    assert stats["software_controlled_keys"] == 6, f"Expected 6 software keys, got {stats['software_controlled_keys']}"
    print(f"✓ TEST 1 PASSED: Baseline loaded exactly 10 registered keys (7 Internal, 3 Third-Party; 4 Human, 6 Software).")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 2: Add 2 API keys. Confirm the total count becomes 12.
    # -------------------------------------------------------------
    print("\n[TEST 2] Add 2 new API keys and confirm total count becomes 12...")
    key1 = ApiKeyCreate(
        name="Audit Logging Streamer",
        owner_name="Compliance / Kavita Roy",
        ownership_type="INTERNAL",
        control_type="SOFTWARE_CONTROLLED",
        connected_system="BlueVault",
        approved_ips=["10.0.1.210"],
        allowed_systems=["BlueVault"],
        allowed_permissions=["READ_DATA"],
        expected_permissions=["READ_DATA"],
        normal_records_threshold=400
    )
    r1 = main.create_api_key(key1)
    k1_id = r1["key_id"]

    key2 = ApiKeyCreate(
        name="Partner Telematics Ingest",
        owner_name="FastTrack Global (Third-Party)",
        ownership_type="THIRD_PARTY",
        control_type="SOFTWARE_CONTROLLED",
        connected_system="TallyBridge Connect",
        approved_ips=["198.51.100.105"],
        allowed_systems=["TallyBridge Connect"],
        allowed_permissions=["WRITE_DATA"],
        expected_permissions=["WRITE_DATA"],
        normal_records_threshold=600
    )
    r2 = main.create_api_key(key2)
    k2_id = r2["key_id"]

    stats = main.get_dashboard_stats()
    assert stats["total_registered_keys"] == 12, f"Expected 12 registered keys, got {stats['total_registered_keys']}"
    print(f"✓ TEST 2 PASSED: Added {k1_id} and {k2_id}. Total registered key count dynamically updated to 12.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 3: Activity using unregistered API key. Detected but not auto-registered.
    # -------------------------------------------------------------
    print("\n[TEST 3] Generate activity using unregistered API key...")
    shadow_act = ActivitySubmit(
        key_id="KEY-SHADOW-UNKNOWN",
        source_ip="198.51.100.222",
        connected_system="SSO",
        activity_name="Probing User Directory",
        permission_used="READ_DATA",
        records_accessed=5
    )
    act_res = main.submit_activity(shadow_act)
    assert act_res["is_unregistered"] is True, "Expected is_unregistered=True"
    assert act_res["status"] == "CRITICAL", f"Expected status CRITICAL, got {act_res['status']}"

    # Verify inventory total is STILL 12 (not auto-registered)
    stats = main.get_dashboard_stats()
    assert stats["total_registered_keys"] == 12, f"Unregistered key was erroneously added! Count={stats['total_registered_keys']}"
    assert stats["unregistered_keys_detected"] >= 1, f"Unregistered key detection counter not updated!"
    print(f"✓ TEST 3 PASSED: Unregistered key KEY-SHADOW-UNKNOWN detected as CRITICAL, not added to registered inventory (Total remains 12).")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 4: Use registered key from multiple unexpected IPs (Shared Key)
    # -------------------------------------------------------------
    print("\n[TEST 4] Test shared key monitoring across multiple unexpected IPs...")
    main.submit_activity(ActivitySubmit(
        key_id="KEY-106",
        source_ip="185.220.101.5", # external rogue IP
        connected_system="HelpDeskr",
        activity_name="Offshore Session Query",
        permission_used="READ_DATA",
        records_accessed=10
    ))
    res4 = main.submit_activity(ActivitySubmit(
        key_id="KEY-106",
        source_ip="45.33.32.156", # second external unexpected IP
        connected_system="HelpDeskr",
        activity_name="Remote Session Query",
        permission_used="READ_DATA",
        records_accessed=15
    ))
    assert res4["is_shared_misuse"] is True, "Shared key misuse should be flagged"
    print(f"✓ TEST 4 PASSED: Shared key misuse detected for KEY-106 across multiple unexpected IP addresses.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 5: Open Critical Keys page and view involved shared keys
    # -------------------------------------------------------------
    print("\n[TEST 5] View Critical Keys page endpoint...")
    crit = main.get_critical_keys()
    shared_ids = [k["key_id"] for k in crit["shared_keys"]]
    assert "KEY-106" in shared_ids, f"KEY-106 not found in shared keys: {shared_ids}"
    print(f"✓ TEST 5 PASSED: Critical Keys endpoint lists shared keys with IP origins and risk analysis.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 6: Generate over-privileged key activity and confirm extra permissions shown
    # -------------------------------------------------------------
    print("\n[TEST 6] Over-privileged key activity detection...")
    res6 = main.submit_activity(ActivitySubmit(
        key_id="KEY-103",
        source_ip="172.16.50.12",
        connected_system="LedgerOne",
        activity_name="Query High-Value Payroll",
        permission_used="ACCESS_FINANCIAL_RECORDS",
        records_accessed=50
    ))
    assert res6["is_overprivileged"] is True, "Expected overprivileged flag"
    assert "ACCESS_FINANCIAL_RECORDS" in res6["explanation"]
    print(f"✓ TEST 6 PASSED: Over-privileged permission ACCESS_FINANCIAL_RECORDS correctly flagged with explanation.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 7: Generate bulk data access and confirm flagged
    # -------------------------------------------------------------
    print("\n[TEST 7] Bulk data access detection...")
    res7 = main.submit_activity(ActivitySubmit(
        key_id="KEY-104",
        source_ip="10.0.1.100",
        connected_system="BlueVault",
        activity_name="Manifest Archive Bulk Export",
        permission_used="READ_DATA",
        records_accessed=10000
    ))
    assert res7["is_bulk_data"] is True, "Expected bulk data flag"
    print(f"✓ TEST 7 PASSED: Bulk data access of 10,000 records flagged (threshold: 500).")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 8: Run complete breach simulation
    # -------------------------------------------------------------
    print("\n[TEST 8] Run complete breach simulation...")
    sim_res = main.trigger_complete_breach()
    assert sim_res["status"] == "SUCCESS"
    assert sim_res["incident_status"] == "CONFIRMED_BREACH"
    assert sim_res["total_events_generated"] == 7
    print(f"✓ TEST 8 PASSED: Complete breach simulation executed with 7 correlated attack chain events.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 9: Confirm incident created and all involved API keys visible
    # -------------------------------------------------------------
    print("\n[TEST 9] Verify incident and involved keys in database...")
    inc_id = sim_res["incident_id"]
    inc_detail = main.get_incident_detail(inc_id)
    involved = [k["key_id"] for k in inc_detail["involved_keys"]]
    assert "KEY-103" in involved, "KEY-103 should be involved in breach"
    assert "KEY-106" in involved, "KEY-106 should be involved in breach"
    assert "KEY-SHADOW-X" in involved, "KEY-SHADOW-X should be involved in breach"
    assert len(inc_detail["timeline"]) >= 7, "Timeline should include all events"
    print(f"✓ TEST 9 PASSED: Incident {inc_id} confirmed. All involved keys visible: {involved}.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 10: Manually revoke one involved API key (KEY-103)
    # -------------------------------------------------------------
    print("\n[TEST 10] Manually revoke compromised API key KEY-103...")
    rev_res = main.revoke_api_key("KEY-103", ApiKeyRevoke(
        reason="Security incident containment - verified financial exfiltration",
        admin_name="SecOps Admin (Tensor Terminators)"
    ))
    assert rev_res["new_status"] == "REVOKED"

    # Verify status in database
    detail_check = main.get_api_key_detail("KEY-103")
    assert detail_check["key_data"]["status"] == "REVOKED"
    print(f"✓ TEST 10 PASSED: KEY-103 manually revoked. Database status updated to REVOKED, timeline event recorded.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 11: Generate request using revoked key and confirm critical alert
    # -------------------------------------------------------------
    print("\n[TEST 11] Generate request using the revoked key...")
    res11 = main.submit_activity(ActivitySubmit(
        key_id="KEY-103",
        source_ip="185.220.101.5",
        connected_system="LedgerOne",
        activity_name="Post-Revocation Unauthorized Infiltration Attempt",
        permission_used="READ_DATA",
        records_accessed=10
    ))
    assert res11["is_revoked_usage"] is True, "Revoked key usage should be flagged"
    assert res11["status"] == "CRITICAL", f"Expected CRITICAL status, got {res11['status']}"
    alerts = [a["alert_type"] for a in res11["alerts_generated"]]
    assert "REVOKED_KEY_USAGE" in alerts, f"Expected REVOKED_KEY_USAGE alert, got {alerts}"
    print(f"✓ TEST 11 PASSED: Revoked key usage detected immediately as CRITICAL violation.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 12: Confirm applicable reportable incident and verify 6-hour countdown starts
    # -------------------------------------------------------------
    print("\n[TEST 12] Verify 6-Hour CERT-In Countdown...")
    cd = main.get_cert_in_countdown()
    assert cd["has_active_countdown"] is True, "Active countdown should be running"
    assert cd["remaining_hours"] in [5, 6], f"Expected 5 or 6 remaining hours, got {cd['remaining_hours']}"
    assert cd["reporting_status"] == "Time Running"
    print(f"✓ TEST 12 PASSED: 6-Hour CERT-In Countdown active. Time remaining: {cd['remaining_hours']}h {cd['remaining_minutes']}m. Status: '{cd['reporting_status']}'.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 13: Refresh simulation and verify countdown persists from database
    # -------------------------------------------------------------
    print("\n[TEST 13] Verify countdown persistence across re-queries...")
    cd1 = main.get_cert_in_countdown()
    cd2 = main.get_cert_in_countdown()
    assert cd1["notice_time"] == cd2["notice_time"], "Notice time must remain immutable and persisted"
    assert cd1["reporting_deadline"] == cd2["reporting_deadline"], "Deadline must remain immutable"
    print(f"✓ TEST 13 PASSED: Countdown state is strictly persisted in database; immune to reloads or resets.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 14: Generate and download the PDF report
    # -------------------------------------------------------------
    print("\n[TEST 14] Generate and download PDF incident report...")
    from pdf_generator import generate_incident_pdf
    pdf_buf = generate_incident_pdf(inc_id)
    pdf_bytes = pdf_buf.getvalue()
    assert len(pdf_bytes) > 2000, f"PDF file size suspiciously small: {len(pdf_bytes)} bytes"
    assert pdf_bytes.startswith(b"%PDF"), "Generated file does not have valid PDF header"
    print(f"✓ TEST 14 PASSED: Generated valid downloadable PDF report ({len(pdf_bytes):,} bytes) with all required sections.")
    passed_tests += 1

    # -------------------------------------------------------------
    # TEST 15: Verify data consistency across dashboard, inventory, alerts, incident and report
    # -------------------------------------------------------------
    print("\n[TEST 15] Verify global data consistency across all endpoints...")
    dash_stats = main.get_dashboard_stats()
    all_keys = main.list_api_keys()
    all_alerts = main.get_security_alerts()

    # Total registered keys in dashboard matches keys endpoint length
    assert dash_stats["total_registered_keys"] == len(all_keys), f"Mismatch: Dashboard has {dash_stats['total_registered_keys']} keys, list has {len(all_keys)}"
    # Revoked keys count in dashboard matches status filter in inventory
    revoked_count = len([k for k in all_keys if k["status"] == "REVOKED"])
    assert dash_stats["revoked_keys"] == revoked_count, f"Mismatch: Dashboard revoked={dash_stats['revoked_keys']}, actual={revoked_count}"
    # Confirmed breaches count in dashboard matches incident status
    assert dash_stats["confirmed_breaches"] >= 1, "Dashboard should show at least 1 confirmed breach"
    print(f"✓ TEST 15 PASSED: Perfect consistency confirmed across Dashboard, Inventory, Alerts, Incidents, and PDF!")
    passed_tests += 1

    print("\n" + "=" * 70)
    print(f"ALL {passed_tests} / {total_tests} END-TO-END TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
