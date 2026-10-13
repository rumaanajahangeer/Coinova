const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'cpt_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }

  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(data?.error || res.statusText || 'Request failed', res.status);
  }
  return data;
}

export const api = {
  // auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PATCH', body }),

  // portfolio
  portfolio: () => request('/portfolio'),
  history: (days) => request(`/portfolio/history?days=${days}`),

  // holdings
  addHolding: (body) => request('/holdings', { method: 'POST', body }),
  updateHolding: (id, body) => request(`/holdings/${id}`, { method: 'PUT', body }),
  deleteHolding: (id) => request(`/holdings/${id}`, { method: 'DELETE' }),

  // coins
  searchCoins: (q) => request(`/coins/search?q=${encodeURIComponent(q)}`),
  topCoins: (limit = 12) => request(`/coins/top?limit=${limit}`),
  coinChart: (id, days) => request(`/coins/${encodeURIComponent(id)}/chart?days=${days}`),

  // alerts
  alerts: () => request('/alerts'),
  createAlert: (body) => request('/alerts', { method: 'POST', body }),
  deleteAlert: (id) => request(`/alerts/${id}`, { method: 'DELETE' }),
  reactivateAlert: (id) => request(`/alerts/${id}/reactivate`, { method: 'PATCH' }),
  ackAlerts: (ids) => request('/alerts/ack', { method: 'POST', body: { ids } }),

  // wallets
  wallets: () => request('/wallet'),
  importWallet: (address, label) =>
    request('/wallet/import', { method: 'POST', body: { address, label } }),
  deleteWallet: (address) => request(`/wallet/${address}`, { method: 'DELETE' }),
};
