import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCw,
  Send,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { api } from '../api';

export default function LiveMonitoring({ onOpenKeyDetail, showToast, refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Manual test submission form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [manualKey, setManualKey] = useState('KEY-101');
  const [manualIp, setManualIp] = useState('192.168.10.15');
  const [manualSystem, setManualSystem] = useState('LedgerOne');
  const [manualActivityName, setManualActivityName] = useState('Test Query');
  const [manualPermission, setManualPermission] = useState('READ_DATA');
  const [manualRecords, setManualRecords] = useState(25);

  const fetchActivities = async () => {
    try {
      const data = await api.getActivities({
        limit: 100,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [statusFilter, refreshTrigger]);

  useEffect(() => {
    let interval = null;
    if (isLivePolling) {
      interval = setInterval(() => {
        fetchActivities();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLivePolling, statusFilter]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.submitActivity({
        key_id: manualKey.trim(),
        source_ip: manualIp.trim(),
        connected_system: manualSystem,
        activity_name: manualActivityName.trim(),
        permission_used: manualPermission,
        records_accessed: parseInt(manualRecords, 10) || 1
      });
      showToast(`Request analyzed: Status ${res.status}`, res.status === 'SAFE' ? 'success' : 'warning');
      setShowSubmitModal(false);
      fetchActivities();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isLivePolling ? '#10b981' : '#64748b',
            boxShadow: isLivePolling ? '0 0 8px #10b981' : 'none'
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
            {isLivePolling ? 'Real-Time Activity Stream (Polling Active)' : 'Stream Paused'}
          </span>
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            {isLivePolling ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="SAFE">Safe Requests</option>
            <option value="WARNING">Warnings</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="CRITICAL">Critical Threats</option>
          </select>

          <button
            onClick={fetchActivities}
            className="btn btn-secondary"
            title="Refresh now"
          >
            <RotateCw size={14} /> Refresh
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-primary"
          >
            <Send size={14} /> Simulate Single Request
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>API Key ID</th>
              <th>Source IP</th>
              <th>Connected System</th>
              <th>Activity / Endpoint</th>
              <th>Permission</th>
              <th>Records</th>
              <th>Status</th>
              <th>Security Explanation</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No API activity logs recorded yet. Run a simulation scenario to stream events!
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="font-mono" style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {act.timestamp.slice(11, 19)}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenKeyDetail(act.key_id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: act.is_unregistered ? '#ef4444' : '#38bdf8',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {act.key_id}
                    </button>
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px', color: act.is_unapproved_ip ? '#f87171' : '#cbd5e1' }}>
                    {act.source_ip} {act.is_unapproved_ip ? '⚠' : ''}
                  </td>
                  <td style={{ color: '#e2e8f0' }}>{act.connected_system}</td>
                  <td style={{ fontWeight: 500 }}>{act.activity_name}</td>
                  <td>
                    <span className={`badge ${act.is_overprivileged ? 'badge-warning' : 'badge-blue'}`}>
                      {act.permission_used}
                    </span>
                  </td>
                  <td className="font-mono" style={{ color: act.is_bulk_data ? '#f97316' : '#cbd5e1', fontWeight: act.is_bulk_data ? 700 : 400 }}>
                    {act.records_accessed.toLocaleString()} {act.is_bulk_data ? '🔥' : ''}
                  </td>
                  <td>
                    <span className={`badge ${
                      act.status === 'SAFE' ? 'badge-safe' :
                      act.status === 'WARNING' ? 'badge-warning' :
                      act.status === 'SUSPICIOUS' ? 'badge-high-risk' : 'badge-critical'
                    }`}>
                      {act.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#cbd5e1', maxWidth: '320px' }}>
                    {act.explanation}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Request Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                Simulate Single Custom API Request
              </h3>
              <button onClick={() => setShowSubmitModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <div>
                  <label className="input-label">API Key ID</label>
                  <input
                    type="text"
                    className="input"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder="e.g. KEY-101 or unknown KEY-SHADOW"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Source IP Address</label>
                  <input
                    type="text"
                    className="input"
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Connected System</label>
                  <select
                    className="select"
                    value={manualSystem}
                    onChange={(e) => setManualSystem(e.target.value)}
                  >
                    <option value="LedgerOne">LedgerOne</option>
                    <option value="HelpDeskr">HelpDeskr</option>
                    <option value="BlueVault">BlueVault</option>
                    <option value="SSO">SSO</option>
                    <option value="TallyBridge Connect">TallyBridge Connect</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Activity Description</label>
                  <input
                    type="text"
                    className="input"
                    value={manualActivityName}
                    onChange={(e) => setManualActivityName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Permission Used</label>
                  <select
                    className="select"
                    value={manualPermission}
                    onChange={(e) => setManualPermission(e.target.value)}
                  >
                    <option value="READ_DATA">READ_DATA</option>
                    <option value="WRITE_DATA">WRITE_DATA</option>
                    <option value="MODIFY_RECORDS">MODIFY_RECORDS</option>
                    <option value="ACCESS_FINANCIAL_RECORDS">ACCESS_FINANCIAL_RECORDS</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Records Accessed</label>
                  <input
                    type="number"
                    className="input"
                    value={manualRecords}
                    onChange={(e) => setManualRecords(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} /> Submit & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
