import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Ban,
  Check,
  Filter
} from 'lucide-react';
import { api } from '../api';

export default function SecurityAlerts({ onOpenKeyDetail, onOpenRevoke, showToast, refreshTrigger }) {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(statusFilter !== 'ALL' ? statusFilter : undefined);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch security alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, refreshTrigger]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId);
      showToast(`Alert ${alertId} marked as Acknowledged.`, 'success');
      fetchAlerts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      showToast(`Alert ${alertId} resolved.`, 'success');
      fetchAlerts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BellRing size={18} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
            Security Threat Alerts ({alerts.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Alert Statuses</option>
            <option value="ACTIVE">Active Alerts Only</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Time</th>
              <th>Target Key</th>
              <th>Alert Type</th>
              <th>Severity</th>
              <th>Source IP</th>
              <th>System</th>
              <th>Threat Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Loading security alerts...
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No security alerts in current filter view.
                </td>
              </tr>
            ) : (
              alerts.map((al) => (
                <tr key={al.alert_id}>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 700, color: '#fca5a5' }}>
                      {al.alert_id}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {al.timestamp.slice(11, 19)}
                  </td>
                  <td>
                    <button
                      onClick={() => onOpenKeyDetail(al.key_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {al.key_id}
                    </button>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9' }}>
                      {al.alert_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      al.severity === 'CRITICAL' ? 'badge-critical' :
                      al.severity === 'HIGH_RISK' ? 'badge-high-risk' : 'badge-warning'
                    }`}>
                      {al.severity}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px' }}>{al.source_ip}</td>
                  <td style={{ color: '#cbd5e1' }}>{al.connected_system}</td>
                  <td style={{ fontSize: '12px', color: '#cbd5e1', maxWidth: '320px' }}>
                    {al.details}
                  </td>
                  <td>
                    <span className={`badge ${
                      al.status === 'ACTIVE' ? 'badge-critical' :
                      al.status === 'ACKNOWLEDGED' ? 'badge-warning' : 'badge-safe'
                    }`}>
                      {al.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {al.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAcknowledge(al.alert_id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Acknowledge Alert"
                        >
                          Ack
                        </button>
                      )}
                      {al.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolve(al.alert_id)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Mark Resolved"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => onOpenRevoke(al.key_id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        title="Revoke Key"
                      >
                        <Ban size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
