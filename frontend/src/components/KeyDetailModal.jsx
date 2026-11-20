import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Ban,
  Clock,
  Activity,
  History,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function KeyDetailModal({ keyId, onClose, onOpenRevoke, showToast, onRefreshKeys }) {
  const [detail, setDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, activity, history
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getKeyDetail(keyId);
      setDetail(data);
    } catch (err) {
      showToast(err.message || 'Failed to load key details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keyId) {
      fetchDetail();
    }
  }, [keyId]);

  const handleRequestRotation = async () => {
    try {
      await api.rotateKey(keyId, { reason: 'Requested during security review in modal' });
      showToast(`Key ${keyId} queued for secret rotation.`, 'success');
      fetchDetail();
      onRefreshKeys();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkReviewed = async () => {
    try {
      await api.reviewKey(keyId, { review_status: 'REVIEWED', notes: 'Administrative compliance review completed' });
      showToast(`Key ${keyId} marked as REVIEWED.`, 'success');
      fetchDetail();
      onRefreshKeys();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!detail && loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ padding: '30px', textAlign: 'center' }}>
          Loading key details...
        </div>
      </div>
    );
  }

  if (!detail) return null;
  const { key_data: k, activity_history, change_history, related_alerts } = detail;

  const isRevoked = k.status === 'REVOKED';

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(0, 180, 216, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-blue)'
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9' }}>
                  {k.key_id}
                </h3>
                <span className={`badge ${
                  k.status === 'ACTIVE' ? 'badge-safe' :
                  k.status === 'REVOKED' ? 'badge-critical' : 'badge-warning'
                }`}>
                  {k.status}
                </span>
                {k.is_overprivileged === 1 && (
                  <span className="badge badge-warning">Over-Privileged</span>
                )}
                {k.is_shared === 1 && (
                  <span className="badge badge-high-risk">Shared Key</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {k.name} • {k.connected_system}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isRevoked && (
              <button
                onClick={() => onOpenRevoke(k.key_id, k.name)}
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Ban size={14} /> Revoke Key
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0 20px'
        }}>
          {[
            { id: 'overview', label: 'Key Overview', icon: FileCheck },
            { id: 'activity', label: `Activity Logs (${activity_history.length})`, icon: Activity },
            { id: 'history', label: `Change History (${change_history.length})`, icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--color-blue)' : '2px solid transparent',
                  color: active ? 'var(--color-blue)' : '#94a3b8',
                  fontWeight: active ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick stats banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Requests</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                    {k.total_requests.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Records Accessed</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                    {k.total_records_accessed.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Normal Threshold</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>
                    {k.normal_records_threshold} records
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Key Owner:</span>{' '}
                  <strong style={{ color: '#f1f5f9' }}>{k.owner_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Ownership Type:</span>{' '}
                  <strong style={{ color: '#f1f5f9' }}>{k.ownership_type.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Control Type:</span>{' '}
                  <strong style={{ color: '#f1f5f9' }}>{k.control_type.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Connected System:</span>{' '}
                  <strong style={{ color: '#f1f5f9' }}>{k.connected_system}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Created Date:</span>{' '}
                  <span style={{ color: '#cbd5e1' }}>{k.created_date?.slice(0, 10)}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Last Used:</span>{' '}
                  <span style={{ color: '#cbd5e1' }}>{k.last_used_at ? k.last_used_at.replace('T', ' ').slice(0, 19) : 'Never'}</span>
                </div>
              </div>

              {/* Approved IPs */}
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Approved IP Boundary:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {k.approved_ips.map((ip) => (
                    <span key={ip} className="badge badge-safe font-mono" style={{ textTransform: 'none' }}>
                      {ip}
                    </span>
                  ))}
                  {k.last_used_ip && !k.approved_ips.includes(k.last_used_ip) && (
                    <span className="badge badge-critical font-mono" style={{ textTransform: 'none' }}>
                      Last Used (Unapproved): {k.last_used_ip}
                    </span>
                  )}
                </div>
              </div>

              {/* Permissions & Over-privileged Comparison */}
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Permissions & Role Scope:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', width: '130px' }}>Assigned:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {k.allowed_permissions.map((p) => {
                        const isExcess = !k.expected_permissions.includes(p);
                        return (
                          <span key={p} className={`badge ${isExcess ? 'badge-warning' : 'badge-blue'}`}>
                            {p} {isExcess ? '(Excess)' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', width: '130px' }}>Expected Baseline:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {k.expected_permissions.map((p) => (
                        <span key={p} className="badge badge-safe">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Alerts for this key */}
              {related_alerts.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} /> Active Security Alerts ({related_alerts.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {related_alerts.map((al) => (
                      <div key={al.alert_id} style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}>
                        <strong style={{ color: '#fca5a5' }}>{al.alert_id} [{al.alert_type}]:</strong> {al.details}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {activity_history.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  No activity recorded for this key yet.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Source IP</th>
                        <th>Activity</th>
                        <th>Permission</th>
                        <th>Records</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity_history.map((act) => (
                        <tr key={act.id}>
                          <td className="font-mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {act.timestamp.slice(11, 19)}
                          </td>
                          <td className="font-mono">{act.source_ip}</td>
                          <td>{act.activity_name}</td>
                          <td><span className="badge badge-blue">{act.permission_used}</span></td>
                          <td className="font-mono">{act.records_accessed}</td>
                          <td>
                            <span className={`badge ${
                              act.status === 'SAFE' ? 'badge-safe' :
                              act.status === 'WARNING' ? 'badge-warning' :
                              act.status === 'SUSPICIOUS' ? 'badge-high-risk' : 'badge-critical'
                            }`}>
                              {act.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="timeline">
              {change_history.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className={`timeline-dot ${item.action_type === 'REVOKED' ? 'critical' : 'safe'}`} />
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {item.timestamp.slice(0, 19).replace('T', ' ')} • Admin: {item.admin_name}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                    Action: {item.action_type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    {item.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleMarkReviewed}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              <CheckCircle2 size={14} /> Mark as Reviewed
            </button>
            <button
              onClick={handleRequestRotation}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              <RotateCw size={14} /> Request Rotation
            </button>
          </div>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
