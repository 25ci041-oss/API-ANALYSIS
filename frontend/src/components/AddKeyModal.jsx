import React, { useState } from 'react';
import { PlusCircle, X, ShieldAlert } from 'lucide-react';
import { api } from '../api';

const SYSTEM_OPTIONS = ['LedgerOne', 'HelpDeskr', 'BlueVault', 'SSO', 'TallyBridge Connect'];
const PERMISSION_OPTIONS = [
  'READ_DATA',
  'WRITE_DATA',
  'MODIFY_RECORDS',
  'DELETE_RECORDS',
  'ACCESS_FINANCIAL_RECORDS',
  'ACCESS_CUSTOMER_RECORDS'
];

export default function AddKeyModal({ onClose, onKeyCreated, showToast }) {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownershipType, setOwnershipType] = useState('INTERNAL');
  const [controlType, setControlType] = useState('SOFTWARE_CONTROLLED');
  const [connectedSystem, setConnectedSystem] = useState('LedgerOne');
  const [approvedIps, setApprovedIps] = useState('192.168.10.60');
  const [allowedPerms, setAllowedPerms] = useState(['READ_DATA']);
  const [expectedPerms, setExpectedPerms] = useState(['READ_DATA']);
  const [normalThreshold, setNormalThreshold] = useState(500);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAllowedPerm = (perm) => {
    if (allowedPerms.includes(perm)) {
      setAllowedPerms(allowedPerms.filter((p) => p !== perm));
    } else {
      setAllowedPerms([...allowedPerms, perm]);
    }
  };

  const toggleExpectedPerm = (perm) => {
    if (expectedPerms.includes(perm)) {
      setExpectedPerms(expectedPerms.filter((p) => p !== perm));
    } else {
      setExpectedPerms([...expectedPerms, perm]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) {
      showToast('Please provide Key Name and Owner Name.', 'error');
      return;
    }

    const ipList = approvedIps
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    setIsSubmitting(true);
    try {
      const res = await api.createKey({
        name: name.trim(),
        owner_name: ownerName.trim(),
        ownership_type: ownershipType,
        control_type: controlType,
        connected_system: connectedSystem,
        approved_ips: ipList,
        allowed_systems: [connectedSystem],
        allowed_permissions: allowedPerms.length > 0 ? allowedPerms : ['READ_DATA'],
        expected_permissions: expectedPerms.length > 0 ? expectedPerms : ['READ_DATA'],
        normal_records_threshold: parseInt(normalThreshold, 10) || 500,
        notes: notes.trim() || 'New API key registration'
      });

      showToast('New API key registered. Total key count updated.', 'success');
      onKeyCreated(res);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create API key.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 180, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-blue)'
            }}>
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                Register New API Key
              </h3>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                System will assign a unique identifier (e.g. KEY-111) and update inventory counts.
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label">Key Name / Purpose *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Warehouse Inventory Sync"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="input-label">Owner Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Vikram Patel (Ops)"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label">Ownership Classification</label>
                <select
                  className="select"
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value)}
                >
                  <option value="INTERNAL">Internal (Company)</option>
                  <option value="THIRD_PARTY">Third-Party (Vendor)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Control Classification</label>
                <select
                  className="select"
                  value={controlType}
                  onChange={(e) => setControlType(e.target.value)}
                >
                  <option value="SOFTWARE_CONTROLLED">Software (Automated)</option>
                  <option value="HUMAN_CONTROLLED">Human (Manual User)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Connected System</label>
                <select
                  className="select"
                  value={connectedSystem}
                  onChange={(e) => setConnectedSystem(e.target.value)}
                >
                  {SYSTEM_OPTIONS.map((sys) => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Approved IP Addresses (comma separated)</label>
              <input
                type="text"
                className="input"
                placeholder="192.168.10.60, 10.0.1.55"
                value={approvedIps}
                onChange={(e) => setApprovedIps(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Requests from source IPs outside this boundary will be flagged as unapproved access.
              </div>
            </div>

            <div>
              <label className="input-label">Assigned Permissions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PERMISSION_OPTIONS.map((perm) => {
                  const selected = allowedPerms.includes(perm);
                  return (
                    <button
                      type="button"
                      key={perm}
                      onClick={() => toggleAllowedPerm(perm)}
                      className={`badge ${selected ? 'badge-blue' : 'badge-safe'}`}
                      style={{ cursor: 'pointer', opacity: selected ? 1 : 0.4 }}
                    >
                      {selected ? '✓ ' : '+ '}{perm}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="input-label">Expected Baseline Permissions (Role Scope)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PERMISSION_OPTIONS.map((perm) => {
                  const selected = expectedPerms.includes(perm);
                  return (
                    <button
                      type="button"
                      key={perm}
                      onClick={() => toggleExpectedPerm(perm)}
                      className={`badge ${selected ? 'badge-safe' : 'badge-warning'}`}
                      style={{ cursor: 'pointer', opacity: selected ? 1 : 0.4 }}
                    >
                      {selected ? '✓ ' : '+ '}{perm}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                If Assigned Permissions exceed Expected Permissions, the key is classified as Over-Privileged.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label">Normal Records Threshold</label>
                <input
                  type="number"
                  className="input"
                  value={normalThreshold}
                  onChange={(e) => setNormalThreshold(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Operational Notes</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Nightly export pipeline"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <PlusCircle size={15} />
              <span>{isSubmitting ? 'Registering...' : 'Save & Register Key'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
