import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';
import AddKeyModal from './components/AddKeyModal';
import KeyDetailModal from './components/KeyDetailModal';
import RevokeModal from './components/RevokeModal';

import Dashboard from './pages/Dashboard';
import ApiKeyInventory from './pages/ApiKeyInventory';
import CriticalKeys from './pages/CriticalKeys';
import LiveMonitoring from './pages/LiveMonitoring';
import AttackSimulation from './pages/AttackSimulation';
import SecurityAlerts from './pages/SecurityAlerts';
import IncidentInvestigation from './pages/IncidentInvestigation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import { api } from './api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedKeyForDetail, setSelectedKeyForDetail] = useState(null);
  const [revokeModalData, setRevokeModalData] = useState(null); // { keyId, keyName }

  // Notifications
  const [toast, setToast] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchStats();
  };

  const handleResetSimulation = async () => {
    setIsResetting(true);
    try {
      await api.resetSimulation();
      showToast('Simulation reset: Restored baseline 10 registered API keys.', 'success');
      handleRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to reset simulation.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenRevoke = (keyId, keyName) => {
    setRevokeModalData({ keyId, keyName });
  };

  const handleOpenKeyDetail = (keyId) => {
    setSelectedKeyForDetail(keyId);
  };

  const pageTitles = {
    dashboard: 'Executive Dashboard & Live Counts',
    inventory: 'API Key Inventory & Lifecycle Management',
    critical: 'Critical API Keys & Boundary Management',
    monitoring: 'Live API Activity & Traffic Analysis',
    simulation: 'Attack Simulation Lab',
    alerts: 'Security Threat Alerts',
    investigation: 'Incident Investigation & Breach Attribution',
    reports: 'Compliance & Incident Response PDF Reports',
    settings: 'Detection Configuration & Audit Trail'
  };

  const hasBreach = stats?.confirmed_breaches > 0;

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        alertCount={stats?.active_alerts || 0}
      />

      <div className="main-wrapper">
        <Header
          pageTitle={pageTitles[currentPage] || 'Dashboard'}
          hasBreach={hasBreach}
          onOpenAddModal={() => setAddModalOpen(true)}
          onResetSimulation={handleResetSimulation}
          isResetting={isResetting}
        />

        <main className="content-body">
          {currentPage === 'dashboard' && (
            <Dashboard
              stats={stats}
              onNavigate={setCurrentPage}
              onOpenKeyDetail={handleOpenKeyDetail}
              onOpenAddModal={() => setAddModalOpen(true)}
            />
          )}

          {currentPage === 'inventory' && (
            <ApiKeyInventory
              onOpenKeyDetail={handleOpenKeyDetail}
              onOpenRevoke={handleOpenRevoke}
              onOpenAddModal={() => setAddModalOpen(true)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'critical' && (
            <CriticalKeys
              onOpenKeyDetail={handleOpenKeyDetail}
              onOpenRevoke={handleOpenRevoke}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'monitoring' && (
            <LiveMonitoring
              onOpenKeyDetail={handleOpenKeyDetail}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'simulation' && (
            <AttackSimulation
              onNavigate={setCurrentPage}
              showToast={showToast}
              onResetSimulation={handleResetSimulation}
              isResetting={isResetting}
              onSimulationRun={handleRefresh}
            />
          )}

          {currentPage === 'alerts' && (
            <SecurityAlerts
              onOpenKeyDetail={handleOpenKeyDetail}
              onOpenRevoke={handleOpenRevoke}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'investigation' && (
            <IncidentInvestigation
              onOpenKeyDetail={handleOpenKeyDetail}
              onOpenRevoke={handleOpenRevoke}
              onNavigate={setCurrentPage}
              showToast={showToast}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'reports' && (
            <Reports
              showToast={showToast}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              showToast={showToast}
              onResetSimulation={handleResetSimulation}
              isResetting={isResetting}
            />
          )}
        </main>
      </div>

      {/* Add Key Modal */}
      {addModalOpen && (
        <AddKeyModal
          onClose={() => setAddModalOpen(false)}
          onKeyCreated={() => {
            handleRefresh();
          }}
          showToast={showToast}
        />
      )}

      {/* Key Detail Modal */}
      {selectedKeyForDetail && (
        <KeyDetailModal
          keyId={selectedKeyForDetail}
          onClose={() => setSelectedKeyForDetail(null)}
          onOpenRevoke={(keyId, name) => {
            setSelectedKeyForDetail(null);
            handleOpenRevoke(keyId, name);
          }}
          showToast={showToast}
          onRefreshKeys={handleRefresh}
        />
      )}

      {/* Revoke Confirmation Modal */}
      {revokeModalData && (
        <RevokeModal
          keyId={revokeModalData.keyId}
          keyName={revokeModalData.keyName}
          onClose={() => setRevokeModalData(null)}
          onRevocationComplete={() => {
            handleRefresh();
          }}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      <NotificationToast
        toast={toast}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
