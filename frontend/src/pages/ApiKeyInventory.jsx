import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Ban,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { api } from '../api';

export default function ApiKeyInventory({
  onOpenKeyDetail,
  onOpenRevoke,
  onOpenAddModal,
  refreshTrigger
}) {
  const [keys, setKeys] = useState([]);
  const [search, setSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState('ALL');
  const [controlFilter, setControlFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [systemFilter, setSystemFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.getKeys({
        search: search.trim() || undefined,
        ownership: ownershipFilter !== 'ALL' ? ownershipFilter : undefined,
        control: controlFilter !== 'ALL' ? controlFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        system: systemFilter !== 'ALL' ? systemFilter : undefined
      });
      setKeys(data);
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [search, ownershipFilter, controlFilter, statusFilter, systemFilter, refreshTrigger]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top action bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by Key ID, Name, Owner, or System..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
          >
            <option value="ALL">Ownership: All</option>
            <option value="INTERNAL">Internal</option>
            <option value="THIRD_PARTY">Third-Party</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={controlFilter}
            onChange={(e) => setControlFilter(e.target.value)}
          >
            <option value="ALL">Control: All</option>
            <option value="HUMAN_CONTROLLED">Human</option>
            <option value="SOFTWARE_CONTROLLED">Software</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
          >
            <option value="ALL">System: All</option>
            <option value="LedgerOne">LedgerOne</option>
            <option value="HelpDeskr">HelpDeskr</option>
            <option value="BlueVault">BlueVault</option>
            <option value="SSO">SSO</option>
            <option value="TallyBridge Connect">TallyBridge Connect</option>
          </select>

          <button onClick={onOpenAddModal} className="btn btn-primary">
            <PlusCircle size={15} /> Add Key
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Key ID</th>
              <th>Key Name & Purpose</th>
              <th>Owner</th>
              <th>Ownership</th>
              <th>Control</th>
              <th>System</th>
              <th>Approved IPs</th>
              <th>Requests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Loading API key records from database...
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No API keys found matching filter criteria.
                </td>
              </tr>
            ) : (
              keys.map((k) => {
                const isRevoked = k.status === 'REVOKED';
                return (
                  <tr key={k.key_id}>
                    <td>
                      <button
                        onClick={() => onOpenKeyDetail(k.key_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '13px'
                        }}
                      >
                        {k.key_id}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{k.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Threshold: {k.normal_records_threshold} recs
                      </div>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{k.owner_name}</td>
                    <td>
                      <span className={`badge ${k.ownership_type === 'INTERNAL' ? 'badge-blue' : 'badge-warning'}`}>
                        {k.ownership_type === 'INTERNAL' ? 'Internal' : 'Third-Party'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                        {k.control_type === 'HUMAN_CONTROLLED' ? 'Human' : 'Software'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{k.connected_system}</span>
                    </td>
                    <td>
                      <div className="font-mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {k.approved_ips?.slice(0, 2).join(', ')}
                        {k.approved_ips?.length > 2 ? ` +${k.approved_ips.length - 2}` : ''}
                      </div>
                    </td>
                    <td className="font-mono" style={{ color: '#cbd5e1' }}>
                      {k.total_requests.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${
                        k.status === 'ACTIVE' ? 'badge-safe' :
                        k.status === 'REVOKED' ? 'badge-critical' :
                        k.status === 'INACTIVE' ? 'badge-warning' : 'badge-critical'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onOpenKeyDetail(k.key_id)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '11px' }}
                          title="View Full Key Profile"
                        >
                          <Eye size={13} /> View
                        </button>
                        {!isRevoked && (
                          <button
                            onClick={() => onOpenRevoke(k.key_id, k.name)}
                            className="btn btn-danger"
                            style={{ padding: '5px 9px', fontSize: '11px' }}
                            title="Revoke Compromised Key"
                          >
                            <Ban size={13} /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {keys.length} API keys in registered inventory.</span>
        <span>Never exposes actual secret key values • Fictional demonstration IDs</span>
      </div>
    </div>
  );
}
