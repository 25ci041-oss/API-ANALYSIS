import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Share2,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  RotateCw,
  Ban,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function CriticalKeys({
  onOpenKeyDetail,
  onOpenRevoke,
  showToast,
  refreshTrigger
}) {
  const [criticalData, setCriticalData] = useState({ shared_keys: [], overprivileged_keys: [] });
  const [activeTab, setActiveTab] = useState('shared'); // 'shared' or 'overpriv'
  const [loading, setLoading] = useState(true);

  const fetchCritical = async () => {
    setLoading(true);
    try {
      const data = await api.getCriticalKeys();
      setCriticalData(data);
    } catch (err) {
      console.error('Failed to load critical keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCritical();
  }, [refreshTrigger]);

  const handleMarkReviewed = async (keyId) => {
    try {
      await api.reviewKey(keyId, { review_status: 'REVIEWED', notes: 'Compliance review performed' });
      showToast(`Key ${keyId} marked as REVIEWED.`, 'success');
      fetchCritical();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestRotation = async (keyId) => {
    try {
      await api.rotateKey(keyId, { reason: 'Critical key proactive rotation' });
      showToast(`Rotation requested for ${keyId}.`, 'success');
      fetchCritical();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const { shared_keys, overprivileged_keys } = criticalData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info Banner */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        gap: '14px',
        alignItems: 'center'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b',
          flexShrink: 0
        }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fef3c7' }}>
            High-Priority Vulnerability Management
          </h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
            Keys in this section possess either anomalous shared network footprints or excessive privileges beyond least-privilege baselines. They undergo a shorter 7-day administrative review cycle.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('shared')}
          className={`btn ${activeTab === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Share2 size={15} />
          <span>A. Shared API Keys ({shared_keys.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('overpriv')}
          className={`btn ${activeTab === 'overpriv' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Unlock size={15} />
          <span>B. Over-Privileged Keys ({overprivileged_keys.length})</span>
        </button>
      </div>

      {/* SECTION A: SHARED KEYS */}
      {activeTab === 'shared' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Shared API keys are monitored for unexpected multi-IP origins. Approved cluster IPs are recognized as legitimate, while unapproved external origins escalate risk.
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Key ID</th>
                  <th>Owner</th>
                  <th>Control / System</th>
                  <th>Observed IPs</th>
                  <th>Unapproved IPs</th>
                  <th>Total Requests</th>
                  <th>Risk Level</th>
                  <th>Review Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      Analyzing shared network access patterns...
                    </td>
                  </tr>
                ) : shared_keys.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No shared key anomalies detected.
                    </td>
                  </tr>
                ) : (
                  shared_keys.map((k) => (
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
                            cursor: 'pointer'
                          }}
                        >
                          {k.key_id}
                        </button>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>
                        <div>{k.owner_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {k.ownership_type === 'INTERNAL' ? 'Internal' : 'Third-Party'}
                        </div>
                      </td>
                      <td>
                        <div>{k.connected_system}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {k.control_type === 'HUMAN_CONTROLLED' ? 'Human' : 'Software'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                          {k.observed_ips?.map((ip) => (
                            <span
                              key={ip}
                              className={`badge font-mono ${
                                k.approved_ips?.includes(ip) ? 'badge-safe' : 'badge-critical'
                              }`}
                              style={{ fontSize: '10px', textTransform: 'none' }}
                            >
                              {ip}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {k.unapproved_observed_ips?.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {k.unapproved_observed_ips.map((ip) => (
                              <span key={ip} className="badge badge-critical font-mono" style={{ fontSize: '10px', textTransform: 'none' }}>
                                ⚠ {ip}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10b981' }}>None (Approved Cluster)</span>
                        )}
                      </td>
                      <td className="font-mono">{k.total_requests}</td>
                      <td>
                        <span className={`badge ${k.risk_level === 'HIGH_RISK' ? 'badge-critical' : 'badge-warning'}`}>
                          {k.risk_level}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          k.review_status === 'REVIEWED' ? 'badge-safe' :
                          k.review_status === 'UNDER_REVIEW' ? 'badge-warning' : 'badge-high-risk'
                        }`}>
                          {k.review_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleMarkReviewed(k.key_id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Mark as Reviewed"
                          >
                            <CheckCircle2 size={13} /> Review
                          </button>
                          <button
                            onClick={() => handleRequestRotation(k.key_id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Queue Secret Rotation"
                          >
                            <RotateCw size={13} /> Rotate
                          </button>
                          {k.status !== 'REVOKED' && (
                            <button
                              onClick={() => onOpenRevoke(k.key_id, k.name)}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              title="Revoke Key"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B: OVER-PRIVILEGED KEYS */}
      {activeTab === 'overpriv' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Keys that possess extra permissions exceeding their documented business role. Extra permissions violate the principle of least privilege and expand breach blast radius.
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Key ID</th>
                  <th>Key Name & Owner</th>
                  <th>System</th>
                  <th>Expected Baseline</th>
                  <th>Assigned Permissions</th>
                  <th>Extra Excessive Permissions</th>
                  <th>Risk Level</th>
                  <th>Suggested Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      Comparing role permissions against expected baselines...
                    </td>
                  </tr>
                ) : overprivileged_keys.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No over-privileged keys detected in current inventory.
                    </td>
                  </tr>
                ) : (
                  overprivileged_keys.map((k) => (
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
                            cursor: 'pointer'
                          }}
                        >
                          {k.key_id}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{k.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{k.owner_name}</div>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>{k.connected_system}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {k.expected_permissions?.map((p) => (
                            <span key={p} className="badge badge-safe" style={{ fontSize: '10px' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {k.allowed_permissions?.map((p) => (
                            <span key={p} className="badge badge-blue" style={{ fontSize: '10px' }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {k.extra_permissions?.map((p) => (
                            <span key={p} className="badge badge-critical" style={{ fontSize: '10px' }}>
                              ⚠ {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${k.risk_level === 'HIGH_RISK' ? 'badge-critical' : 'badge-warning'}`}>
                          {k.risk_level}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: '#fca5a5', maxWidth: '200px' }}>
                        {k.suggested_action}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleMarkReviewed(k.key_id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <CheckCircle2 size={13} /> Review
                          </button>
                          {k.status !== 'REVOKED' && (
                            <button
                              onClick={() => onOpenRevoke(k.key_id, k.name)}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
