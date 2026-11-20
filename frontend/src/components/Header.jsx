import React from 'react';
import { ShieldCheck, ShieldAlert, PlusCircle, RotateCcw, User } from 'lucide-react';

export default function Header({
  pageTitle,
  hasBreach,
  onOpenAddModal,
  onResetSimulation,
  isResetting
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        {hasBreach ? (
          <span className="badge badge-critical" style={{ animation: 'pulse 2s infinite' }}>
            <ShieldAlert size={14} /> Confirmed Breach Active
          </span>
        ) : (
          <span className="badge badge-safe">
            <ShieldCheck size={14} /> System Operational & Safe
          </span>
        )}
      </div>

      <div className="header-right">
        <button
          onClick={onResetSimulation}
          disabled={isResetting}
          className="btn btn-secondary"
          title="Reset demo data back to clean 10 registered keys"
        >
          <RotateCcw size={15} style={{ animation: isResetting ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="btn btn-primary"
        >
          <PlusCircle size={15} />
          <span>Add New API Key</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '12px'
        }}>
          <User size={14} style={{ color: 'var(--color-blue)' }} />
          <span style={{ color: '#cbd5e1' }}>SecOps Admin</span>
        </div>
      </div>
    </header>
  );
}
