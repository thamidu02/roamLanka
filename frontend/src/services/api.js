export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getCollection(resource) {
  const response = await fetch(`${API_BASE_URL}/${resource}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Unable to load ${resource}.`);
  }

  return result.data || [];
}

export async function sendAuthRequest(action, payload) {
  const response = await fetch(`${API_BASE_URL}/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Something went wrong. Please try again.");
  }

  return result;
}

export async function sendAdminRequest(resource, payload, token) {
  const response = await fetch(`${API_BASE_URL}/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Unable to create ${resource.slice(0, -1)}.`);
  return result.data;
}
