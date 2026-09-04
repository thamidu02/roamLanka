export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Generic authenticated request helper ────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("lankaToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function sendAuthRequest(action, payload) {
  return apiRequest("POST", `/auth/${action}`, payload);
}

// ── Places CRUD ──────────────────────────────────────────────────────────────
export async function getPlaces() {
  const result = await apiRequest("GET", "/places");
  return result.data || [];
}

export async function createPlace(data) {
  return apiRequest("POST", "/places", data);
}

export async function updatePlace(id, data) {
  return apiRequest("PUT", `/places/${id}`, data);
}

export async function deletePlace(id) {
  return apiRequest("DELETE", `/places/${id}`);
}

// ── Hotels CRUD ──────────────────────────────────────────────────────────────
export async function getHotels() {
  const result = await apiRequest("GET", "/hotels");
  return result.data || [];
}

export async function createHotel(data) {
  return apiRequest("POST", "/hotels", data);
}

export async function updateHotel(id, data) {
  return apiRequest("PUT", `/hotels/${id}`, data);
}

export async function deleteHotel(id) {
  return apiRequest("DELETE", `/hotels/${id}`);
}

// ── Events CRUD ──────────────────────────────────────────────────────────────
export async function getEvents() {
  const result = await apiRequest("GET", "/events");
  return result.data || [];
}

export async function createEvent(data) {
  return apiRequest("POST", "/events", data);
}

export async function updateEvent(id, data) {
  return apiRequest("PUT", `/events/${id}`, data);
}

export async function deleteEvent(id) {
  return apiRequest("DELETE", `/events/${id}`);
}
