import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ toast, onDismiss }) {
  if (!toast) return null;

  const { message, type = 'info' } = toast;

  const icons = {
    success: <CheckCircle2 size={18} style={{ color: '#10b981' }} />,
    warning: <AlertTriangle size={18} style={{ color: '#f59e0b' }} />,
    error: <XCircle size={18} style={{ color: '#ef4444' }} />,
    info: <Info size={18} style={{ color: '#00b4d8' }} />
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.4)',
    warning: 'rgba(245, 158, 11, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
    info: 'rgba(0, 180, 216, 0.4)'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#0d1630',
      border: `1px solid ${borderColors[type] || borderColors.info}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1000,
      maxWidth: '460px',
      animation: 'slideIn 0.2s ease-out'
    }}>
      {icons[type] || icons.info}
      <div style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 500, flex: 1 }}>
        {message}
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
