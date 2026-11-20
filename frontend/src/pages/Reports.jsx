import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Printer
} from 'lucide-react';
import { api } from '../api';

export default function Reports({ showToast }) {
  const [incident, setIncident] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadReportContext = async () => {
      try {
        const incidents = await api.getIncidents();
        if (incidents.length > 0) {
          setIncident(incidents[0]);
        }
        const cd = await api.getCountdown();
        setCountdown(cd);
      } catch (err) {
        console.error('Failed to load report context:', err);
      }
    };
    loadReportContext();
  }, []);

  const incidentId = incident?.incident_id || 'INC-2026-BREACH-01';

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    showToast('Generating official PDF report with ReportLab...', 'info');
    try {
      const url = api.getPdfDownloadUrl(incidentId);
      // Trigger browser download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Incident_Report_${incidentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('PDF Report downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download PDF report.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(0, 180, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-blue)'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
              INCIDENT RESPONSE PDF REPORT GENERATOR
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Written in simple, plain English for compliance officers, CERT-In statutory filings, and executive leadership.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="btn btn-primary"
          style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
        >
          <Download size={16} />
          <span>{isGenerating ? 'Generating PDF...' : 'GENERATE INCIDENT REPORT (PDF)'}</span>
        </button>
      </div>

      {/* Report Document Preview Container */}
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: 'var(--radius-md)',
        padding: '40px 48px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        lineHeight: 1.6,
        fontSize: '13px'
      }}>
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                REAL TIME API ANALYSIS – INCIDENT RESPONSE REPORT
              </h1>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                Cybersecurity Monitoring & CERT-In Statutory Reporting Compliance
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>TEAM: TENSOR TERMINATORS</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Domain: Cyber Security</div>
            </div>
          </div>
        </div>

        {/* Section A: Incident Summary */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
            A. Incident Summary
          </h3>
          <p style={{ color: '#1e293b' }}>
            A critical cybersecurity incident was detected involving unauthorized API key activity and abnormal data access.
            The attack originated from an unapproved external IP address that exploited an over-privileged third-party API key.
            An unexpected volume of sensitive vendor and billing records was extracted, accompanied by attempted modification of payment routing data.
            The security team promptly initiated containment measures, flagged compromised keys for revocation, and recorded official notice for CERT-In reporting.
          </p>
        </div>

        {/* Section B: Incident Information */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
            B. Incident Information
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 12px', fontWeight: 700, width: '25%' }}>Incident ID:</td>
                <td style={{ padding: '6px 12px', color: '#0284c7', fontWeight: 700 }}>{incidentId}</td>
                <td style={{ padding: '6px 12px', fontWeight: 700, width: '25%' }}>Current Status:</td>
                <td style={{ padding: '6px 12px', color: '#dc2626', fontWeight: 700 }}>
                  {incident?.status || 'CONFIRMED BREACH'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 12px', fontWeight: 700 }}>Detection Date/Time:</td>
                <td style={{ padding: '6px 12px' }}>{new Date().toLocaleDateString()} (Recorded)</td>
                <td style={{ padding: '6px 12px', fontWeight: 700 }}>Notice Date/Time:</td>
                <td style={{ padding: '6px 12px' }}>{countdown?.notice_time ? new Date(countdown.notice_time).toLocaleString() : 'Recorded'}</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '6px 12px', fontWeight: 700 }}>Case Study Reference:</td>
                <td style={{ padding: '6px 12px' }}>Harbor & Finch Freight Operations</td>
                <td style={{ padding: '6px 12px', fontWeight: 700 }}>Evidence Corroboration:</td>
                <td style={{ padding: '6px 12px' }}>E13 (Support chat logs) & E16 (Vendor notice)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section C: API Keys Involved */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
            C. API Keys Involved in Breach
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#e2e8f0', color: '#0f172a', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Key ID</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Owner / System</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Ownership</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Control</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Status</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Reason for Involvement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>KEY-103</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>LogiCorp (LedgerOne / TallyBridge)</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Third-Party</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Software</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>REVOKED</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Compromised key used from rogue IP 185.220.101.5 to exfiltrate 14,800 records and alter routing.</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700 }}>KEY-106</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Rohan Deshmukh (HelpDeskr)</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Internal</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Human</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>ACTIVE (Rotation)</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Shared key concurrently accessed from unexpected offshore IP. Subject of E13 chat.</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#dc2626' }}>KEY-SHADOW-X</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Unregistered / Shadow Key (SSO)</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Unknown</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Automated</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700 }}>UNREGISTERED</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Unapproved key observed scanning staff authentication directory without administrative approval.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section D: What Went Wrong? */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
            D. Root Cause Findings: What Went Wrong?
          </h3>
          <ul style={{ paddingLeft: '20px', color: '#1e293b' }}>
            <li><strong>Unknown API Key Usage:</strong> Unregistered key KEY-SHADOW-X scanned the authentication boundary without registration.</li>
            <li><strong>Unapproved Source IP Incursion:</strong> Partner key KEY-103 made requests from rogue public IP 185.220.101.5 instead of approved subnets.</li>
            <li><strong>Excessive Permissions (Over-privileged):</strong> KEY-103 held MODIFY_RECORDS and ACCESS_FINANCIAL_RECORDS which far exceeded its read-only baseline requirement.</li>
            <li><strong>Unusual Bulk Data Access:</strong> Over 14,800 records were queried in a burst, breaching the 500-record baseline threshold.</li>
            <li><strong>Shared Key Misuse:</strong> Support key KEY-106 was shared across shift workstations and logged from outside company IP boundaries.</li>
          </ul>
        </div>

        {/* Section E: Affected Systems */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
            E. Affected Corporate Systems
          </h3>
          <p style={{ color: '#1e293b' }}>
            <strong>LedgerOne (Finance ERP):</strong> 14,800 vendor billing and financial transactions accessed; bank routing coordinates altered and immediately isolated.<br />
            <strong>TallyBridge Connect:</strong> Third-party integration gateway for LogiCorp.<br />
            <strong>SSO:</strong> Staff identity directory probed by reconnaissance scans.<br />
            <strong>HelpDeskr:</strong> Support portal subject of concurrent multi-IP access.
          </p>
        </div>

        {/* Section F: Actions Taken */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
            F. Containment & Remediation Actions Completed
          </h3>
          <ul style={{ paddingLeft: '20px', color: '#1e293b' }}>
            <li>Compromised third-party key KEY-103 placed in REVOKED status in database; subsequent attempts blocked and flagged.</li>
            <li>Shared internal key KEY-106 placed under review and queued for secret rotation.</li>
            <li>Attacker staging IP 185.220.101.5 added to perimeter blacklist rules.</li>
            <li>Chronological evidence timeline compiled and exported for CERT-In regulatory compliance.</li>
          </ul>
        </div>

        {/* Section G: Six-Hour CERT-In Reporting Status */}
        <div style={{
          marginBottom: '20px',
          background: '#fef2f2',
          border: '1px solid #f87171',
          padding: '12px 16px',
          borderRadius: '6px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
            G. Six-Hour CERT-In Statutory Reporting Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#1e293b' }}>
            <div><strong>Statutory Mandate:</strong> Reporting within 6 hours of notice</div>
            <div><strong>Notice Logged:</strong> {countdown?.notice_time ? new Date(countdown.notice_time).toLocaleTimeString() : 'Recorded'}</div>
            <div><strong>Filing Deadline:</strong> {countdown?.reporting_deadline ? new Date(countdown.reporting_deadline).toLocaleTimeString() : 'Within 6 hours'}</div>
            <div><strong>Current Clock Status:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{countdown?.reporting_status || 'Time Running'}</span></div>
          </div>
        </div>

        {/* Section H: Recommendations */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
            H. Recommendations for Security Hardening
          </h3>
          <ol style={{ paddingLeft: '20px', color: '#1e293b' }}>
            <li>Strip MODIFY and FINANCIAL permissions from all third-party vendor connectors (Enforce Least Privilege).</li>
            <li>Enforce mandatory IP whitelisting at API gateway ingress for all programmatic access.</li>
            <li>Rotate shared human credentials and eliminate multi-desk credential sharing.</li>
            <li>Require dual-authorization approval for any modification to vendor banking coordinates.</li>
          </ol>
        </div>

        {/* Document Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px',
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <span>Report Generated by: Real Time API Analysis System (Tensor Terminators)</span>
          <span>Official CERT-In Incident Response Format</span>
        </div>
      </div>
    </div>
  );
}
