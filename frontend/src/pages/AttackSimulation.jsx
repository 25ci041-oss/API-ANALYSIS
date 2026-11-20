import React, { useState } from 'react';
import {
  Flame,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Share2,
  Unlock,
  Database,
  Ban,
  FileEdit,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function AttackSimulation({
  onNavigate,
  showToast,
  onResetSimulation,
  isResetting,
  onSimulationRun
}) {
  const [runningScenario, setRunningScenario] = useState(null);
  const [lastScenarioResult, setLastScenarioResult] = useState(null);
  const [breachResult, setBreachResult] = useState(null);
  const [isBreachRunning, setIsBreachRunning] = useState(false);

  const scenarios = [
    {
      id: 1,
      title: 'Simulation 1 – Normal API Activity',
      desc: 'Simulates legitimate read request from approved key KEY-101 on LedgerOne.',
      expected: 'Status: SAFE • Live monitoring updates • Zero security alerts generated',
      icon: ShieldCheck,
      color: '#10b981'
    },
    {
      id: 2,
      title: 'Simulation 2 – Shadow API Key',
      desc: 'Simulates request with unapproved key KEY-999-SHADOW probing SSO directory.',
      expected: 'Status: CRITICAL • Shadow key alert ALT-2xxx • Key is NOT auto-registered',
      icon: EyeOff,
      color: '#ef4444'
    },
    {
      id: 3,
      title: 'Simulation 3 – Shared API Key Misuse',
      desc: 'Simulates key KEY-106 accessed simultaneously across unexpected external IPs.',
      expected: 'Status: HIGH RISK • Shared key alert • IP boundaries evaluated against approved list',
      icon: Share2,
      color: '#f97316'
    },
    {
      id: 4,
      title: 'Simulation 4 – Over-Privileged Key Misuse',
      desc: 'Simulates key KEY-103 invoking ACCESS_FINANCIAL_RECORDS which exceeds role scope.',
      expected: 'Status: WARNING • Extra permissions flagged • Role least-privilege violation recorded',
      icon: Unlock,
      color: '#eab308'
    },
    {
      id: 5,
      title: 'Simulation 5 – Unapproved IP Access',
      desc: 'Simulates internal billing key KEY-101 accessed from rogue public IP 103.21.244.11.',
      expected: 'Status: SUSPICIOUS • IP boundary alert • Compares approved vs source IP',
      icon: AlertTriangle,
      color: '#f97316'
    },
    {
      id: 6,
      title: 'Simulation 6 – Bulk Data Access',
      desc: 'Simulates storage key KEY-104 extracting 12,500 records from BlueVault in one query.',
      expected: 'Status: HIGH RISK • Bulk data alert • Compares 12,500 recs against 500 baseline threshold',
      icon: Database,
      color: '#f97316'
    },
    {
      id: 7,
      title: 'Simulation 7 – Revoked Key Usage',
      desc: 'Simulates an access attempt using a key previously marked as REVOKED in database.',
      expected: 'Status: CRITICAL • Revoked key violation alert • Immediate perimeter defense trigger',
      icon: Ban,
      color: '#ef4444'
    },
    {
      id: 8,
      title: 'Simulation 8 – Suspicious Data Modification',
      desc: 'Simulates unauthorized alteration of vendor payment routing coordinates in LedgerOne.',
      expected: 'Status: CRITICAL • Payment tampering alert • High-severity containment invoked',
      icon: FileEdit,
      color: '#dc2626'
    }
  ];

  const handleRunScenario = async (id) => {
    setRunningScenario(id);
    try {
      const res = await api.runScenario(id);
      setLastScenarioResult(res);
      showToast(`${res.title} executed successfully!`, 'success');
      onSimulationRun();
    } catch (err) {
      showToast(err.message || 'Failed to run scenario', 'error');
    } finally {
      setRunningScenario(null);
    }
  };

  const handleRunCompleteBreach = async () => {
    setIsBreachRunning(true);
    setBreachResult(null);
    try {
      const res = await api.runCompleteBreach();
      setBreachResult(res);
      showToast('Complete Breach Simulation executed & Incident confirmed!', 'success');
      onSimulationRun();
    } catch (err) {
      showToast(err.message || 'Failed to execute breach simulation', 'error');
    } finally {
      setIsBreachRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Big Master Hero Card: RUN COMPLETE BREACH SIMULATION */}
      <div style={{
        background: 'linear-gradient(135deg, #1b0f2e, #0a1128 70%)',
        border: '2px solid #ef4444',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="badge badge-critical" style={{ fontSize: '12px' }}>
                <Flame size={14} /> Full Attack Chain Lab
              </span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Case Study: Harbor & Finch Freight Operations
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              RUN COMPLETE BREACH SIMULATION
            </h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '800px', marginTop: '6px', lineHeight: 1.6 }}>
              Executes a continuous 7-stage attack chain: normal query → shadow key reconnaissance → shared key anomaly → over-privileged invocation → foreign IP breach → 14,800 record exfiltration → vendor bank tampering. Automatically establishes confirmed incident record, correlates all involved keys, and starts the <strong>6-Hour CERT-In reporting countdown</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onResetSimulation}
              disabled={isResetting || isBreachRunning}
              className="btn btn-secondary"
              style={{ padding: '12px 18px', fontSize: '14px' }}
            >
              <RotateCcw size={16} /> Reset Demo Data
            </button>

            <button
              onClick={handleRunCompleteBreach}
              disabled={isBreachRunning}
              className="btn btn-danger"
              style={{
                padding: '12px 26px',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Flame size={18} style={{ animation: isBreachRunning ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isBreachRunning ? 'Simulating Attack Chain...' : 'RUN COMPLETE BREACH SIMULATION'}</span>
            </button>
          </div>
        </div>

        {/* Breach Execution Summary Results if run */}
        {breachResult && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                  Breach Attack Chain Complete & Correlated! Incident ID: <span style={{ color: '#38bdf8' }}>{breachResult.incident_id}</span>
                </span>
              </div>
              <button
                onClick={() => onNavigate('investigation')}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Go To Incident Investigation <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Events</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                  {breachResult.total_events_generated}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Suspicious Events</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
                  {breachResult.suspicious_activities}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Involved Keys</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', fontFamily: 'JetBrains Mono' }}>
                  {breachResult.api_keys_involved?.join(', ')}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Alerts Generated</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>
                  {breachResult.alerts_generated}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>6-Hour Timer</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>
                  Active (Ticking)
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              <strong>Generated Event Steps:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {breachResult.events?.map((ev) => (
                  <span key={ev.step} className="badge badge-critical" style={{ fontSize: '11px', textTransform: 'none' }}>
                    #{ev.step} {ev.name} ({ev.key}) → {ev.status}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Simulation Scenarios (1 to 8) */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
            Individual Threat Simulation Scenarios (1 – 8)
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Click any button below to trigger and test specific detection rules in isolation.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px'
        }}>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isThisRunning = runningScenario === sc.id;
            return (
              <div
                key={sc.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderTop: `3px solid ${sc.color}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={18} style={{ color: sc.color }} />
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                        {sc.title}
                      </h4>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>
                    {sc.desc}
                  </p>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: '#94a3b8',
                    border: '1px solid var(--border-color)'
                  }}>
                    <strong style={{ color: '#cbd5e1' }}>Expected Result:</strong> {sc.expected}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                  <button
                    onClick={() => handleRunScenario(sc.id)}
                    disabled={isThisRunning}
                    className="btn btn-primary"
                    style={{ padding: '7px 14px', fontSize: '12px', width: '100%' }}
                  >
                    <Play size={13} />
                    <span>{isThisRunning ? 'Simulating...' : `Simulate Scenario ${sc.id}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Scenario Execution Feedback */}
      {lastScenarioResult && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
              Scenario {lastScenarioResult.scenario} Output: {lastScenarioResult.title}
            </span>
            <span className={`badge ${
              lastScenarioResult.result?.status === 'SAFE' ? 'badge-safe' : 'badge-critical'
            }`}>
              Detection Status: {lastScenarioResult.result?.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            <strong>Analysis Explanation:</strong> {lastScenarioResult.result?.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
