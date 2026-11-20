import React from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  UserCheck,
  Cpu,
  Share2,
  Unlock,
  EyeOff,
  Activity,
  BellRing,
  Flame,
  ArrowRight
} from 'lucide-react';
import CertInTimer from '../components/CertInTimer';

export default function Dashboard({ stats, onNavigate, onOpenKeyDetail, onOpenAddModal }) {
  if (!stats) {
    return <div style={{ color: '#94a3b8', padding: '40px' }}>Loading real-time dashboard data...</div>;
  }

  const primaryCards = [
    {
      title: 'Total Registered Keys',
      value: stats.total_registered_keys,
      desc: 'All managed API keys in database',
      icon: KeyRound,
      color: '#00b4d8'
    },
    {
      title: 'Active API Keys',
      value: stats.active_keys,
      desc: 'Keys enabled for production use',
      icon: ShieldCheck,
      color: '#10b981'
    },
    {
      title: 'Revoked API Keys',
      value: stats.revoked_keys,
      desc: 'Permanently invalidated keys',
      icon: ShieldAlert,
      color: '#ef4444'
    },
    {
      title: 'Newly Added Keys',
      value: stats.newly_added_keys,
      desc: 'Registered in the last 24 hours',
      icon: Layers,
      color: '#a855f7'
    }
  ];

  const classificationCards = [
    {
      title: 'Internal API Keys',
      value: stats.internal_keys,
      desc: 'Owned by internal teams',
      icon: ShieldCheck,
      color: '#38bdf8'
    },
    {
      title: 'Third-Party Keys',
      value: stats.third_party_keys,
      desc: 'External vendors & partners',
      icon: Layers,
      color: '#f59e0b'
    },
    {
      title: 'Human Controlled',
      value: stats.human_controlled_keys,
      desc: 'Used manually by personnel',
      icon: UserCheck,
      color: '#34d399'
    },
    {
      title: 'Software Controlled',
      value: stats.software_controlled_keys,
      desc: 'Automated software & pipelines',
      icon: Cpu,
      color: '#818cf8'
    }
  ];

  const riskCards = [
    {
      title: 'Shared API Keys',
      value: stats.shared_keys,
      desc: 'Used from multiple IP origins',
      icon: Share2,
      color: '#f97316',
      badge: 'Attention'
    },
    {
      title: 'Over-Privileged Keys',
      value: stats.overprivileged_keys,
      desc: 'Permissions exceed baseline role',
      icon: Unlock,
      color: '#eab308',
      badge: 'Review'
    },
    {
      title: 'Unregistered Keys Detected',
      value: stats.unregistered_keys_detected,
      desc: 'Shadow keys seen in traffic',
      icon: EyeOff,
      color: '#ef4444',
      badge: stats.unregistered_keys_detected > 0 ? 'Threat' : 'Zero'
    },
    {
      title: 'Affected Breach Keys',
      value: stats.affected_keys,
      desc: 'Involved in active incident',
      icon: ShieldAlert,
      color: stats.affected_keys > 0 ? '#ef4444' : '#10b981',
      badge: stats.affected_keys > 0 ? 'High Priority' : 'None'
    }
  ];

  const activityStats = [
    { title: 'Total API Requests', value: stats.total_requests, icon: Activity, color: '#38bdf8' },
    { title: 'Normal API Requests', value: stats.normal_requests, icon: ShieldCheck, color: '#10b981' },
    { title: 'Suspicious Activities', value: stats.suspicious_activities, icon: AlertTriangle, color: '#f59e0b' },
    { title: 'Active Security Alerts', value: stats.active_alerts, icon: BellRing, color: '#ef4444' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 6-Hour CERT-In Countdown Widget */}
      <CertInTimer />

      {/* Primary Key Inventory Live Counts */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            API Key Inventory & Status Overview
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Database-backed live counting
          </span>
        </div>
        <div className="grid-cards">
          {primaryCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card">
                <div className="card-title">
                  <span>{c.title}</span>
                  <Icon size={18} style={{ color: c.color }} />
                </div>
                <div className="card-value" style={{ color: c.color }}>
                  {c.value}
                </div>
                <div className="card-desc">{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ownership & Control Classification */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Ownership & Control Classification
          </h2>
        </div>
        <div className="grid-cards">
          {classificationCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card">
                <div className="card-title">
                  <span>{c.title}</span>
                  <Icon size={18} style={{ color: c.color }} />
                </div>
                <div className="card-value">
                  {c.value}
                </div>
                <div className="card-desc">{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk & Anomaly Categories */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Critical Risk & Vulnerability Categories
          </h2>
          <button
            onClick={() => onNavigate('critical')}
            style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Manage Critical Keys <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid-cards">
          {riskCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card" style={{ borderLeft: `3px solid ${c.color}` }}>
                <div className="card-title">
                  <span>{c.title}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: c.color, fontSize: '10px' }}>
                    {c.badge}
                  </span>
                </div>
                <div className="card-value" style={{ color: c.color }}>
                  {c.value}
                </div>
                <div className="card-desc">{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Activity Counts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        background: 'rgba(13, 22, 48, 0.4)',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)'
      }}>
        {activityStats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{item.title}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#f1f5f9' }}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Section: Recent Activity & Live Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Recent Activity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--color-blue)' }} /> Recent API Activity Stream
            </h3>
            <button
              onClick={() => onNavigate('monitoring')}
              style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', fontSize: '12px' }}
            >
              View Live Stream →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent_activities?.slice(0, 5).map((act) => (
              <div
                key={act.id}
                onClick={() => onOpenKeyDetail(act.key_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono" style={{ color: '#38bdf8', fontWeight: 600 }}>{act.key_id}</span>
                  <span style={{ color: '#cbd5e1' }}>{act.activity_name}</span>
                  <span style={{ color: '#64748b' }}>({act.connected_system})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="font-mono" style={{ color: '#94a3b8', fontSize: '11px' }}>{act.source_ip}</span>
                  <span className={`badge ${
                    act.status === 'SAFE' ? 'badge-safe' :
                    act.status === 'WARNING' ? 'badge-warning' :
                    act.status === 'SUSPICIOUS' ? 'badge-high-risk' : 'badge-critical'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={16} style={{ color: '#ef4444' }} /> Active Threat Alerts
            </h3>
            <button
              onClick={() => onNavigate('alerts')}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
            >
              All Alerts →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent_alerts?.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No active threat alerts. System posture is clean.
              </div>
            ) : (
              stats.recent_alerts?.slice(0, 4).map((al) => (
                <div
                  key={al.alert_id}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#fca5a5' }}>
                      {al.alert_id} • {al.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className="badge badge-critical font-mono" style={{ fontSize: '10px' }}>
                      {al.key_id}
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '11px' }}>
                    {al.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
