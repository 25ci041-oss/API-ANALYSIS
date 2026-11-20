import React, { useState, useEffect } from 'react';
import {
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Ban,
  RotateCw,
  CheckCircle2,
  FileText,
  Eye,
  Server,
  Database,
  Lock,
  ListChecks,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import CertInTimer from '../components/CertInTimer';

export default function IncidentInvestigation({
  onOpenKeyDetail,
  onOpenRevoke,
  onNavigate,
  showToast,
  refreshTrigger
}) {
  const [incidentData, setIncidentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIncident = async () => {
    setLoading(true);
    try {
      // Fetch latest incident
      const incidents = await api.getIncidents();
      if (incidents.length > 0) {
        const detail = await api.getIncidentDetail(incidents[0].incident_id);
        setIncidentData(detail);
      } else {
        setIncidentData(null);
      }
    } catch (err) {
      console.error('Failed to load incident:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [refreshTrigger]);

  const handleToggleChecklist = async (stepId, currentVal) => {
    if (!incidentData?.incident?.incident_id) return;
    try {
      await api.updateChecklistStep(incidentData.incident.incident_id, {
        step_id: stepId,
        completed: !currentVal
      });
      fetchIncident();
      showToast('Incident response step updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestRotation = async (keyId) => {
    try {
      await api.rotateKey(keyId, { reason: 'Incident response containment rotation' });
      showToast(`Key ${keyId} marked for rotation.`, 'success');
      fetchIncident();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div style={{ color: '#94a3b8', padding: '40px' }}>Loading incident investigation files...</div>;
  }

  if (!incidentData || !incidentData.incident) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px'
      }}>
        <ShieldCheck size={48} style={{ color: '#10b981' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
          No Active Confirmed Security Breaches
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '500px' }}>
          The monitoring perimeter is secure. To simulate a full attack sequence and investigate correlated API keys, launch the Complete Breach Simulation.
        </p>
        <button
          onClick={() => onNavigate('simulation')}
          className="btn btn-primary"
          style={{ marginTop: '8px' }}
        >
          Go to Attack Simulation Lab
        </button>
      </div>
    );
  }

  const { incident, involved_keys = [], timeline = [], checklist = [] } = incidentData;
  const completedSteps = checklist.filter((s) => s.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedSteps / checklist.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 6-Hour CERT-In Countdown Timer Header */}
      <CertInTimer />

      {/* Incident Header Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                {incident.incident_id}
              </span>
              <span className="badge badge-critical">
                {incident.status.replace('_', ' ')}
              </span>
              {incident.evidence_reference && (
                <span className="badge badge-warning">
                  Evidence: {incident.evidence_reference}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>
              {incident.title}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onNavigate('reports')}
              className="btn btn-primary"
            >
              <FileText size={15} />
              <span>Generate PDF Incident Report</span>
            </button>
          </div>
        </div>

        {/* Section: What Happened? */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '4px solid #ef4444'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>
            What Happened? (Executive Summary in Simple English)
          </h4>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
            {incident.description}
          </p>
        </div>
      </div>

      {/* SECTION: ALL API KEYS INVOLVED IN THIS BREACH */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: '#ef4444' }} /> API KEYS INVOLVED IN THIS BREACH ({involved_keys.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Every API key corroborated by event evidence. Click any key to inspect complete activity log.
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Key ID</th>
                <th>Owner Name</th>
                <th>Ownership</th>
                <th>Control</th>
                <th>Approved vs Actual IP</th>
                <th>Permissions Used</th>
                <th>Records Extracted</th>
                <th>Affected System</th>
                <th>Status</th>
                <th>Reason for Involvement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {involved_keys.map((k) => {
                const isRevoked = k.key_status === 'REVOKED';
                return (
                  <tr key={k.key_id}>
                    <td>
                      <button
                        onClick={() => onOpenKeyDetail(k.key_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {k.key_id}
                      </button>
                    </td>
                    <td style={{ color: '#f1f5f9', fontWeight: 500 }}>
                      {k.owner_name || 'Unregistered / Shadow'}
                    </td>
                    <td>
                      <span className={`badge ${k.ownership_type === 'INTERNAL' ? 'badge-blue' : 'badge-warning'}`}>
                        {k.ownership_type ? (k.ownership_type === 'INTERNAL' ? 'Internal' : 'Third-Party') : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                        {k.control_type ? (k.control_type === 'HUMAN_CONTROLLED' ? 'Human' : 'Software') : 'Automated Scan'}
                      </span>
                    </td>
                    <td>
                      <div className="font-mono" style={{ fontSize: '11px' }}>
                        <div style={{ color: '#10b981' }}>Approved: {k.db_approved_ips?.join(', ') || 'None'}</div>
                        <div style={{ color: '#f87171' }}>Observed: {k.ips_used?.join(', ')}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {k.permissions_used?.map((p) => (
                          <span key={p} className={`badge ${p === 'MODIFY_RECORDS' || p === 'ACCESS_FINANCIAL_RECORDS' ? 'badge-critical' : 'badge-blue'}`} style={{ fontSize: '10px' }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: k.records_accessed > 1000 ? '#f97316' : '#cbd5e1' }}>
                      {k.records_accessed.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {k.systems_affected?.map((s) => (
                          <span key={s} className="badge badge-warning" style={{ fontSize: '10px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isRevoked ? 'badge-critical' : 'badge-warning'}`}>
                        {k.key_status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#cbd5e1', maxWidth: '240px' }}>
                      {k.reason_for_involvement}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onOpenKeyDetail(k.key_id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="View Full Profile"
                        >
                          <Eye size={12} />
                        </button>
                        {!isRevoked && k.key_id.startsWith('KEY-1') && (
                          <button
                            onClick={() => onOpenRevoke(k.key_id, k.name)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Revoke Key Immediately"
                          >
                            <Ban size={12} /> Revoke
                          </button>
                        )}
                        {!isRevoked && (
                          <button
                            onClick={() => handleRequestRotation(k.key_id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Request Secret Rotation"
                          >
                            <RotateCw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Affected Systems & Data Accessed Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Affected Systems */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Server size={16} style={{ color: 'var(--color-blue)' }} /> Affected Corporate Systems
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'LedgerOne', desc: 'Finance & Vendor ERP. 14,800 payment ledgers exfiltrated; vendor bank routing coordinates altered.', severity: 'CRITICAL' },
              { name: 'TallyBridge Connect', desc: 'Third-party integration gateway for LogiCorp. Over-privileged key KEY-103 abused.', severity: 'HIGH_RISK' },
              { name: 'SSO', desc: 'Staff authentication gateway. Targeted by reconnaissance probing using shadow key KEY-SHADOW-X.', severity: 'HIGH_RISK' },
              { name: 'HelpDeskr', desc: 'Customer support portal. Internal shift key KEY-106 observed from foreign IP 185.220.101.5.', severity: 'WARNING' },
              { name: 'BlueVault', desc: 'Document & shipping manifest storage. Monitored; perimeter contained.', severity: 'SAFE' }
            ].map((sys) => (
              <div key={sys.name} style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '13px' }}>{sys.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sys.desc}</div>
                </div>
                <span className={`badge ${
                  sys.severity === 'CRITICAL' ? 'badge-critical' :
                  sys.severity === 'HIGH_RISK' ? 'badge-high-risk' :
                  sys.severity === 'WARNING' ? 'badge-warning' : 'badge-safe'
                }`}>
                  {sys.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Response Checklist */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListChecks size={16} style={{ color: '#10b981' }} /> Incident Response Action Checklist
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
              {completedSteps} / {checklist.length} Completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', marginBottom: '14px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {checklist.map((step) => (
              <label
                key={step.step_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: step.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  border: `1px solid ${step.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: step.completed ? '#f1f5f9' : '#cbd5e1'
                }}
              >
                <input
                  type="checkbox"
                  checked={step.completed === 1}
                  onChange={() => handleToggleChecklist(step.step_id, step.completed === 1)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ textDecoration: step.completed ? 'line-through' : 'none', flex: 1 }}>
                  {step.step_title}
                </span>
                {step.completed === 1 && (
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Done</span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Timeline */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Clock size={16} style={{ color: 'var(--color-blue)' }} /> Chronological Incident Evidence Timeline
        </h3>

        <div className="timeline">
          {timeline.map((ev) => {
            const isCrit = ev.event_type === 'ALERT' || ev.event_type === 'CONFIRMATION';
            const isRev = ev.event_type === 'REVOCATION';
            return (
              <div key={ev.id} className="timeline-item">
                <div className={`timeline-dot ${isRev ? 'critical' : isCrit ? 'warning' : 'safe'}`} />
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {ev.timestamp.slice(0, 19).replace('T', ' ')} • Actor: {ev.actor}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isRev ? '#fca5a5' : '#f1f5f9' }}>
                  {ev.event_title}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  {ev.event_description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
