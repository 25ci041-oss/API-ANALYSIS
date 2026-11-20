import React from 'react';
import {
  LayoutDashboard,
  KeyRound,
  AlertTriangle,
  Activity,
  Flame,
  BellRing,
  SearchCode,
  FileText,
  Settings,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, alertCount = 0 }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'API Key Inventory', icon: KeyRound },
    { id: 'critical', label: 'Critical Keys', icon: AlertTriangle },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'simulation', label: 'Attack Simulation', icon: Flame, highlight: true },
    { id: 'alerts', label: 'Security Alerts', icon: BellRing, badge: alertCount },
    { id: 'investigation', label: 'Incident Investigation', icon: SearchCode },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <ShieldAlert size={22} />
        </div>
        <div>
          <div className="sidebar-title">REAL TIME API ANALYSIS</div>
          <div className="sidebar-subtitle">TENSOR TERMINATORS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                textAlign: 'left',
                width: '100%',
                background: isActive ? undefined : 'transparent',
                border: 'none',
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--color-blue)' : item.highlight ? '#f97316' : 'currentColor' }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span className="badge badge-critical" style={{ padding: '2px 6px', fontSize: '10px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '2px' }}>
          CRIMEATHON 2026
        </div>
        <div style={{ color: '#64748b', fontSize: '10px' }}>
          Domain: Cyber Security<br />
          Platform v1.0.0
        </div>
      </div>
    </aside>
  );
}
