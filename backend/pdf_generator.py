import os
import io
import json
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from database import get_connection

def generate_incident_pdf(incident_id: str) -> io.BytesIO:
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Fetch Incident Record
    cursor.execute("SELECT * FROM security_incidents WHERE incident_id = ?", (incident_id,))
    inc_row = cursor.fetchone()
    if not inc_row:
        # If no specific incident found, grab the latest one or generate baseline report
        cursor.execute("SELECT * FROM security_incidents ORDER BY created_at DESC LIMIT 1")
        inc_row = cursor.fetchone()

    incident = dict(inc_row) if inc_row else {
        "incident_id": incident_id or "INC-GENERAL",
        "title": "General API Security & Inventory Health Report",
        "description": "General system monitoring and compliance posture report.",
        "status": "UNDER_INVESTIGATION",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notice_time": datetime.now(timezone.utc).isoformat(),
        "reporting_deadline": None,
        "is_reportable": 0,
        "cert_in_status": "Not Applicable",
        "evidence_reference": "E13 / E16"
    }

    # 2. Fetch Involved Keys
    cursor.execute("""
        SELECT rk.*, ak.name, ak.owner_name, ak.ownership_type, ak.control_type, ak.status as key_status
        FROM incident_related_keys rk
        LEFT JOIN api_keys ak ON rk.key_id = ak.key_id
        WHERE rk.incident_id = ?
    """, (incident["incident_id"],))
    involved_keys_raw = cursor.fetchall()
    involved_keys = [dict(r) for r in involved_keys_raw]

    # If no keys linked to incident, grab recent suspicious/critical keys
    if not involved_keys:
        cursor.execute("SELECT * FROM api_keys WHERE is_overprivileged = 1 OR is_shared = 1 OR status = 'REVOKED' LIMIT 3")
        for k in cursor.fetchall():
            kd = dict(k)
            involved_keys.append({
                "key_id": kd["key_id"],
                "owner_name": kd["owner_name"],
                "ownership_type": kd["ownership_type"],
                "control_type": kd["control_type"],
                "key_status": kd["status"],
                "ips_used": kd["approved_ips"],
                "permissions_used": kd["allowed_permissions"],
                "reason_for_involvement": kd["notes"] or "Flagged in critical monitoring",
                "records_accessed": kd["total_records_accessed"]
            })

    # 3. Fetch Timeline Events
    cursor.execute("SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC", (incident["incident_id"],))
    timeline_rows = cursor.fetchall()
    timeline_events = [dict(r) for r in timeline_rows]

    # 4. Fetch Actions Taken
    cursor.execute("""
        SELECT * FROM admin_actions 
        WHERE timestamp >= ? OR target = ?
        ORDER BY timestamp DESC LIMIT 6
    """, (incident["created_at"], incident["incident_id"]))
    actions_rows = cursor.fetchall()
    actions = [dict(r) for r in actions_rows]

    # 5. Fetch Key Revocations
    cursor.execute("SELECT * FROM key_change_history WHERE action_type IN ('REVOKED', 'ROTATION_REQUESTED') ORDER BY timestamp DESC LIMIT 5")
    revocation_history = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Calculate 6-hour deadline details
    notice_str = incident.get("notice_time")
    deadline_str = incident.get("reporting_deadline")
    remaining_text = "Not Applicable (Incident Not Reportable)"
    cert_status = incident.get("cert_in_status", "Not Applicable")

    if notice_str and deadline_str:
        try:
            deadline_dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            delta = deadline_dt - now_dt
            if delta.total_seconds() > 0:
                hours = int(delta.total_seconds() // 3600)
                mins = int((delta.total_seconds() % 3600) // 60)
                remaining_text = f"{hours} Hours, {mins} Minutes Remaining"
            else:
                remaining_text = "Deadline Expired"
        except Exception:
            remaining_text = "6 Hours from notice time"

    # Build PDF Document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a')
    )

    sub_header_style = ParagraphStyle(
        'SubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )

    badge_critical = ParagraphStyle(
        'CriticalBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#b91c1c')
    )

    elements = []

    # Title Banner
    elements.append(Paragraph("REAL TIME API ANALYSIS – INCIDENT RESPONSE REPORT", header_style))
    elements.append(Paragraph("Cybersecurity Monitoring, Threat Attribution & CERT-In Compliance | Team: Tensor Terminators", sub_header_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb'), spaceBefore=2, spaceAfter=10))

    # SECTION A: Incident Summary
    elements.append(Paragraph("A. Incident Summary", section_heading))
    summary_text = (
        "A critical cybersecurity incident was detected involving unauthorized API key activity and abnormal data access. "
        "The attack originated from an unapproved external IP address that exploited an over-privileged third-party API key. "
        "An unexpected volume of sensitive vendor and billing records was extracted, accompanied by attempted modification of payment routing data. "
        "The security team promptly initiated containment measures, flagged compromised keys for revocation, and recorded official notice for CERT-In reporting."
    )
    elements.append(Paragraph(summary_text, body_style))
    elements.append(Spacer(1, 10))

    # SECTION B: Incident Information Table
    elements.append(Paragraph("B. Incident Information", section_heading))
    info_data = [
        [Paragraph("Incident ID:", body_bold), Paragraph(str(incident["incident_id"]), body_style),
         Paragraph("Incident Status:", body_bold), Paragraph(str(incident["status"]).replace("_", " "), badge_critical)],
        [Paragraph("Detection Date/Time:", body_bold), Paragraph(str(incident.get("created_at", "N/A"))[:19].replace("T", " "), body_style),
         Paragraph("Notice Date/Time:", body_bold), Paragraph(str(incident.get("notice_time", "N/A"))[:19].replace("T", " "), body_style)],
        [Paragraph("Case Study Reference:", body_bold), Paragraph("Harbor & Finch Freight Operations", body_style),
         Paragraph("Evidence Notes:", body_bold), Paragraph(str(incident.get("evidence_reference", "E13 Chat & E16 Notice")), body_style)]
    ]
    t_info = Table(info_data, colWidths=[1.5*inch, 2.2*inch, 1.4*inch, 2.4*inch])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 10))

    # SECTION C: API Keys Involved Table
    elements.append(Paragraph("C. API Keys Involved in Breach", section_heading))
    keys_header = [
        Paragraph("Key ID", body_bold),
        Paragraph("Owner / System", body_bold),
        Paragraph("Ownership", body_bold),
        Paragraph("Control", body_bold),
        Paragraph("Status", body_bold),
        Paragraph("Reason for Involvement", body_bold)
    ]
    keys_rows = [keys_header]
    for k in involved_keys:
        k_id = k.get("key_id", "N/A")
        k_owner = f"{k.get('owner_name') or 'Unknown'}"
        k_ownership = str(k.get("ownership_type", "INTERNAL")).replace("_", " ")
        k_control = "Human" if "HUMAN" in str(k.get("control_type", "")) else "Software"
        k_status = str(k.get("key_status", "ACTIVE"))
        k_reason = str(k.get("reason_for_involvement", "Suspicious traffic detected"))[:100]

        keys_rows.append([
            Paragraph(k_id, body_bold),
            Paragraph(k_owner, body_style),
            Paragraph(k_ownership, body_style),
            Paragraph(k_control, body_style),
            Paragraph(k_status, badge_critical if k_status == 'REVOKED' else body_style),
            Paragraph(k_reason, body_style)
        ])

    t_keys = Table(keys_rows, colWidths=[1.1*inch, 1.6*inch, 1.0*inch, 0.9*inch, 0.9*inch, 2.0*inch])
    t_keys.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_keys)
    elements.append(Spacer(1, 10))

    # SECTION D: What Went Wrong?
    elements.append(Paragraph("D. Root Cause & Findings: What Went Wrong?", section_heading))
    findings = [
        "<b>1. Unregistered Shadow API Key:</b> An unknown key attempted directory enumeration on the SSO gateway from IP 198.51.100.99.",
        "<b>2. Unapproved Source IP Incursion:</b> Legitimate third-party key KEY-103 was utilized from rogue public IP 185.220.101.5 instead of its approved subnet.",
        "<b>3. Over-Privileged Permissions:</b> KEY-103 possessed MODIFY_RECORDS and ACCESS_FINANCIAL_RECORDS permissions which far exceeded its business necessity.",
        "<b>4. Unusual Bulk Data Exfiltration:</b> Over 14,800 records were queried from LedgerOne in a single burst, triggering high-risk anomaly thresholds.",
        "<b>5. Shared Key Irregularity:</b> Support key KEY-106 was simultaneously active across disparate geographic IP addresses."
    ]
    for f in findings:
        elements.append(Paragraph(f, body_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 8))

    # SECTION E & F: Affected Systems and Actions Taken
    elements.append(Paragraph("E. Affected Systems & Impact", section_heading))
    impact_text = (
        "<b>Systems Affected:</b> LedgerOne (Finance ERP), TallyBridge Connect (Partner Gateway), SSO (Staff Authentication), HelpDeskr (Support Portal).<br/>"
        "<b>Records Compromised:</b> Approximately 14,800 vendor billing and financial transactions. Financial routing configuration was inspected and isolated."
    )
    elements.append(Paragraph(impact_text, body_style))
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("F. Incident Actions & Containment", section_heading))
    actions_text = (
        "<b>Containment Actions Completed:</b><br/>"
        "• Compromised API key KEY-103 placed in REVOKED status in database, invalidating future access attempts.<br/>"
        "• Shared key KEY-106 marked for review and credential rotation.<br/>"
        "• Firewall IP boundary updated to blacklist attacker staging IP 185.220.101.5.<br/>"
        "• Investigation timeline documented for legal and regulatory compliance."
    )
    elements.append(Paragraph(actions_text, body_style))
    elements.append(Spacer(1, 8))

    # SECTION G: Six-Hour CERT-In Reporting Status
    elements.append(Paragraph("G. Six-Hour CERT-In Regulatory Reporting Status", section_heading))
    cert_data = [
        [Paragraph("Statutory Requirement:", body_bold), Paragraph("CERT-In Cyber Security Incident Reporting (6-Hour Notice Rule)", body_style)],
        [Paragraph("Incident Notice Time:", body_bold), Paragraph(str(notice_str)[:19].replace("T", " ") if notice_str else "Recorded", body_style)],
        [Paragraph("Reporting Deadline:", body_bold), Paragraph(str(deadline_str)[:19].replace("T", " ") if deadline_str else "Within 6 hours", body_style)],
        [Paragraph("Current Status / Remaining Time:", body_bold), Paragraph(f"<b>{remaining_text}</b> ({cert_status})", badge_critical)]
    ]
    t_cert = Table(cert_data, colWidths=[2.2*inch, 5.3*inch])
    t_cert.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef2f2')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#f87171')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_cert)
    elements.append(Spacer(1, 8))

    # SECTION H: Recommendations
    elements.append(Paragraph("H. Recommendations for Hardening", section_heading))
    recs = [
        "1. <b>Strict Principle of Least Privilege:</b> Strip MODIFY and FINANCIAL permissions from third-party vendor connectors.",
        "2. <b>Mandatory IP Whitelisting:</b> Enforce strict source IP pinning at the gateway firewall level for all API key authentication.",
        "3. <b>Regular Automated Rotation:</b> Transition high-risk and shared keys to 30-day automated secret rotation cycles.",
        "4. <b>Multi-Factor Approval for Financial Records:</b> Require administrative dual-control approval before vendor routing records can be altered."
    ]
    for r in recs:
        elements.append(Paragraph(r, body_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 8))

    # SECTION I: Evidence Timeline
    elements.append(Paragraph("I. Evidence Timeline (Chronological)", section_heading))
    t_header = [Paragraph("Timestamp", body_bold), Paragraph("Event Title", body_bold), Paragraph("Details", body_bold), Paragraph("Actor", body_bold)]
    t_rows = [t_header]
    for ev in timeline_events[-8:]: # show up to 8 recent timeline events
        t_rows.append([
            Paragraph(str(ev.get("timestamp", ""))[:19].replace("T", " "), body_style),
            Paragraph(str(ev.get("event_title", "")), body_bold),
            Paragraph(str(ev.get("event_description", "")), body_style),
            Paragraph(str(ev.get("actor", "System")), body_style)
        ])

    t_timeline = Table(t_rows, colWidths=[1.5*inch, 1.8*inch, 3.0*inch, 1.2*inch])
    t_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(t_timeline)

    # Build the document
    doc.build(elements)
    buffer.seek(0)
    return buffer
