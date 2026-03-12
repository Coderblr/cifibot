const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// In-memory token store (cleared on page refresh — use localStorage for persistence)
let _token = null;

export function getToken() {
  return _token;
}

export function clearToken() {
  _token = null;
}

// ─── AUTH ───────────────────────────────────────────────────────────────────
export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Login failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  _token = data.access_token;
  return data; // { access_token, token_type }
}

// ─── REGISTER ───────────────────────────────────────────────────────────────
export async function register(userPayload) {
  const res = await fetch(`${API_BASE}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed (HTTP ${res.status})`);
  }

  return res.json();
}

// ─── CREATE CIF ─────────────────────────────────────────────────────────────
export async function createCIF({ no_cif, acc_type, region, cust_type }) {
  if (!_token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${API_BASE}/create_cif`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_token}`,
    },
    body: JSON.stringify({ no_cif, acc_type, region, cust_type }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Request failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

// ─── CREATE DEPOSIT ACCOUNT ──────────────────────────────────────────────────
export async function createDepositAccount(payload) {
  if (!_token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${API_BASE}/create_deposit_account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Request failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}
