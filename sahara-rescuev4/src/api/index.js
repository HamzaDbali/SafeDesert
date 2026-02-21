import axios from 'axios'

// ── Base URLs for each microservice ──────────────────────────────────────────
const AUTH_URL         = 'http://localhost:3001'
const LOCATION_URL     = 'http://localhost:3002'
const SOS_URL          = 'http://localhost:3003'
const SYNC_URL         = 'http://localhost:3004'
const VERIFICATION_URL = 'http://localhost:3005'

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken  = ()         => localStorage.getItem('token')
export const setToken  = (token)    => localStorage.setItem('token', token)
export const clearToken = ()        => localStorage.removeItem('token')

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH  — port 3001
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) =>
    axios.post(`${AUTH_URL}/signup`, data),

  login: (data) =>
    axios.post(`${AUTH_URL}/login`, data),

  verify: () =>
    axios.get(`${AUTH_URL}/verify`, { headers: authHeader() }),

  getProfile: (id) =>
    axios.get(`${AUTH_URL}/profile/${id}`, { headers: authHeader() }),

  updateProfile: (id, data) =>
    axios.patch(`${AUTH_URL}/profile/${id}`, data, { headers: authHeader() }),
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOCATIONS  — port 3002
// ─────────────────────────────────────────────────────────────────────────────
export const locationAPI = {
  add: (data) =>
    axios.post(`${LOCATION_URL}/add`, data, { headers: authHeader() }),

  getAll: (type) =>
    axios.get(`${LOCATION_URL}/all`, { headers: authHeader(), params: type ? { type } : {} }),

  getNearby: (lng, lat, maxDistance = 5000) =>
    axios.get(`${LOCATION_URL}/nearby`, { headers: authHeader(), params: { lng, lat, maxDistance } }),

  getOne: (id) =>
    axios.get(`${LOCATION_URL}/${id}`, { headers: authHeader() }),

  update: (id, data) =>
    axios.put(`${LOCATION_URL}/${id}`, data, { headers: authHeader() }),

  remove: (id) =>
    axios.delete(`${LOCATION_URL}/${id}`, { headers: authHeader() }),
}

// ─────────────────────────────────────────────────────────────────────────────
//  SOS  — port 3003
// ─────────────────────────────────────────────────────────────────────────────
export const sosAPI = {
  send: (data) =>
    axios.post(`${SOS_URL}/send`, data, { headers: authHeader() }),

  getActive: () =>
    axios.get(`${SOS_URL}/active`, { headers: authHeader() }),

  getNearby: (lng, lat, maxDistance = 5000) =>
    axios.get(`${SOS_URL}/nearby`, { headers: authHeader(), params: { lng, lat, maxDistance } }),

  getMine: () =>
    axios.get(`${SOS_URL}/mine`, { headers: authHeader() }),

  getOne: (id) =>
    axios.get(`${SOS_URL}/${id}`, { headers: authHeader() }),

  resolve: (id) =>
    axios.put(`${SOS_URL}/resolve/${id}`, {}, { headers: authHeader() }),

  remove: (id) =>
    axios.delete(`${SOS_URL}/${id}`, { headers: authHeader() }),
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYNC  — port 3004
// ─────────────────────────────────────────────────────────────────────────────
export const syncAPI = {
  log: (data) =>
    axios.post(`${SYNC_URL}/sync`, data, { headers: authHeader() }),

  getMine: () =>
    axios.get(`${SYNC_URL}/mine`, { headers: authHeader() }),

  getLast: () =>
    axios.get(`${SYNC_URL}/last`, { headers: authHeader() }),

  getAll: () =>
    axios.get(`${SYNC_URL}/all`, { headers: authHeader() }),

  remove: (id) =>
    axios.delete(`${SYNC_URL}/${id}`, { headers: authHeader() }),
}

// ─────────────────────────────────────────────────────────────────────────────
//  VERIFICATION  — port 3005
// ─────────────────────────────────────────────────────────────────────────────
export const verificationAPI = {
  add: (locationId, status) =>
    axios.post(`${VERIFICATION_URL}/add`, { locationId, status }, { headers: authHeader() }),

  getByLocation: (locationId) =>
    axios.get(`${VERIFICATION_URL}/location/${locationId}`, { headers: authHeader() }),

  getMine: () =>
    axios.get(`${VERIFICATION_URL}/mine`, { headers: authHeader() }),

  update: (id, status) =>
    axios.put(`${VERIFICATION_URL}/${id}`, { status }, { headers: authHeader() }),

  remove: (id) =>
    axios.delete(`${VERIFICATION_URL}/${id}`, { headers: authHeader() }),
}
