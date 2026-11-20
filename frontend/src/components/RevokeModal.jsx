import React, { useState } from 'react';
import { AlertTriangle, ShieldX, X } from 'lucide-react';
import { api } from '../api';

export default function RevokeModal({ keyId, keyName, onClose, onRevocationComplete, showToast }) {
  const [reason, setReason] = useState('Suspected credential leakage and abnormal data access in security incident');
  const [adminName, setAdminName] = useState('SecOps Admin (Tensor Terminators)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmRevoke = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.revokeKey(keyId, {
        reason: reason.trim(),
        admin_name: adminName
      });
      showToast(`API Key ${keyId} revoked successfully. Status changed to REVOKED in database.`, 'success');
      onRevocationComplete(res);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to revoke API key.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <ShieldX size={18} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              Confirm API Key Revocation
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#fca5a5',
            display: 'flex',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Action Notice:</strong> This action will immediately mark <strong>{keyId}</strong> as <strong>REVOKED</strong> in the database. Any further simulated attempts using this key will trigger critical security alerts.
            </div>
          </div>

          <div>
            <label className="input-label">Target API Key ID</label>
            <div style={{
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'JetBrains Mono',
              fontWeight: 700,
              fontSize: '15px',
              color: '#38bdf8'
            }}>
              {keyId} {keyName ? `— (${keyName})` : ''}
            </div>
          </div>

          <div>
            <label className="input-label">Revocation Reason</label>
            <textarea
              className="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the security violation or breach finding..."
            />
          </div>

          <div>
            <label className="input-label">Authorized Administrator</label>
            <input
              type="text"
              className="input"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirmRevoke}
            disabled={isSubmitting}
            className="btn btn-danger"
          >
            <ShieldX size={15} />
            <span>{isSubmitting ? 'Revoking Key...' : 'Revoke API Key Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
