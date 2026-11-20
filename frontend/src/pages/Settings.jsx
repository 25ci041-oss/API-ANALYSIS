import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Shield,
  Clock,
  Database,
  History,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function Settings({ showToast, onResetSimulation, isResetting }) {
  const [settings, setSettings] = useState({
    bulk_data_threshold: '1000',
    cert_in_deadline_hours: '6',
    critical_review_interval_days: '7',
    normal_review_interval_days: '30',
    current_admin: 'SecOps Admin (Tensor Terminators)'
  });
  const [adminActions, setAdminActions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettingsAndAudit = async () => {
    try {
      const data = await api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
      const actions = await api.getAdminActions();
      setAdminActions(actions);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSaveSetting = async (key, val) => {
    setIsSaving(true);
    try {
      await api.updateSetting({ setting_key: key, setting_value: String(val) });
      showToast(`Setting '${key}' updated.`, 'success');
      fetchSettingsAndAudit();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* System Thresholds */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <SettingsIcon size={16} style={{ color: 'var(--color-blue)' }} /> Detection Engine Thresholds & Parameters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Bulk Data Access Alert Threshold (Records)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  className="input"
                  value={settings.bulk_data_threshold}
                  onChange={(e) => setSettings({ ...settings, bulk_data_threshold: e.target.value })}
                />
                <button
                  onClick={() => handleSaveSetting('bulk_data_threshold', settings.bulk_data_threshold)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Save
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Queries accessing records above this threshold trigger the Bulk Data Access anomaly alert.
              </div>
            </div>

            <div>
              <label className="input-label">CERT-In Statutory Reporting Window (Hours)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  className="input"
                  value={settings.cert_in_deadline_hours}
                  onChange={(e) => setSettings({ ...settings, cert_in_deadline_hours: e.target.value })}
                />
                <button
                  onClick={() => handleSaveSetting('cert_in_deadline_hours', settings.cert_in_deadline_hours)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Save
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Prescribed 6-hour cybersecurity reporting timeframe per CERT-In regulatory guidelines.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Critical Review Cycle (Days)</label>
                <input
                  type="number"
                  className="input"
                  value={settings.critical_review_interval_days}
                  onChange={(e) => setSettings({ ...settings, critical_review_interval_days: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Normal Review Cycle (Days)</label>
                <input
                  type="number"
                  className="input"
                  value={settings.normal_review_interval_days}
                  onChange={(e) => setSettings({ ...settings, normal_review_interval_days: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="input-label">SecOps Admin Identity</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="input"
                  value={settings.current_admin}
                  onChange={(e) => setSettings({ ...settings, current_admin: e.target.value })}
                />
                <button
                  onClick={() => handleSaveSetting('current_admin', settings.current_admin)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Environment Management */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--color-blue)' }} /> Database & Demo Management
          </h3>

          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div><strong>Active Database:</strong> SQLite (Local Development Fallback)</div>
            <div><strong>Production Target:</strong> PostgreSQL (Compatible Schema Architecture)</div>
            <div><strong>Status:</strong> <span style={{ color: '#10b981' }}>Connected & Healthy (WAL Mode)</span></div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            fontSize: '12px',
            color: '#fca5a5'
          }}>
            <strong>Demonstration Reset:</strong> Safely resets the simulation database back to the baseline 10 registered API keys. Does not modify external systems or corrupt application state.
          </div>

          <button
            onClick={onResetSimulation}
            disabled={isResetting}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px' }}
          >
            <RotateCcw size={15} />
            <span>{isResetting ? 'Resetting Baseline...' : 'Reset Demo to 10 Baseline Keys'}</span>
          </button>
        </div>
      </div>

      {/* Admin Audit Logs */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={16} style={{ color: 'var(--color-blue)' }} /> Administrative Action Audit Log
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target Object</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {adminActions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No administrative actions recorded yet.
                  </td>
                </tr>
              ) : (
                adminActions.map((act) => (
                  <tr key={act.id}>
                    <td className="font-mono" style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {act.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td style={{ fontWeight: 600, color: '#cbd5e1' }}>{act.admin_name}</td>
                    <td>
                      <span className="badge badge-blue">{act.action}</span>
                    </td>
                    <td className="font-mono" style={{ color: '#38bdf8' }}>{act.target}</td>
                    <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{act.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
