const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `Server error: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorMsg = errJson.detail;
      } catch (e) {
        // use default error message
      }
      throw new Error(errorMsg);
    }
    
    // Check if response is json or stream
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // API Key Inventory
  getKeys: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/keys${query ? `?${query}` : ''}`);
  },
  getKeyDetail: (keyId) => request(`/keys/${encodeURIComponent(keyId)}`),
  createKey: (data) => request('/keys', { method: 'POST', body: JSON.stringify(data) }),
  updateKey: (keyId, data) => request(`/keys/${encodeURIComponent(keyId)}`, { method: 'PUT', body: JSON.stringify(data) }),
  revokeKey: (keyId, data) => request(`/keys/${encodeURIComponent(keyId)}/revoke`, { method: 'POST', body: JSON.stringify(data) }),
  rotateKey: (keyId, data) => request(`/keys/${encodeURIComponent(keyId)}/rotate`, { method: 'POST', body: JSON.stringify(data) }),
  reviewKey: (keyId, data) => request(`/keys/${encodeURIComponent(keyId)}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Critical Keys
  getCriticalKeys: () => request('/critical-keys'),

  // Live Activity Monitoring
  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activity${query ? `?${query}` : ''}`);
  },
  submitActivity: (data) => request('/activity', { method: 'POST', body: JSON.stringify(data) }),

  // Security Alerts
  getAlerts: (status) => request(`/alerts${status ? `?status=${status}` : ''}`),
  acknowledgeAlert: (alertId) => request(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'POST' }),
  resolveAlert: (alertId) => request(`/alerts/${encodeURIComponent(alertId)}/resolve`, { method: 'POST' }),

  // Attack Simulation Lab
  runScenario: (scenarioId) => request(`/simulations/scenario/${scenarioId}`, { method: 'POST' }),
  runCompleteBreach: () => request('/simulations/complete-breach', { method: 'POST' }),
  resetSimulation: () => request('/simulations/reset', { method: 'POST' }),

  // Incident Investigation & Response
  getIncidents: () => request('/incidents'),
  getIncidentDetail: (incidentId) => request(`/incidents/${encodeURIComponent(incidentId)}`),
  confirmIncident: (data) => request('/incidents/confirm', { method: 'POST', body: JSON.stringify(data) }),
  updateChecklistStep: (incidentId, data) => request(`/incidents/${encodeURIComponent(incidentId)}/checklist`, { method: 'PUT', body: JSON.stringify(data) }),

  // 6-Hour CERT-In Countdown
  getCountdown: () => request('/countdown'),

  // PDF Report
  getPdfDownloadUrl: (incidentId) => `/api/reports/incident/${encodeURIComponent(incidentId)}/pdf`,

  // Settings & Audit
  getSettings: () => request('/settings'),
  updateSetting: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
  getAdminActions: () => request('/admin-actions'),
};
