const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_BASE = BASE_URL.replace(/\/api$/, "");

// Use sessionStorage instead of localStorage — scoped per tab, not accessible
// by other origins, reducing XSS exposure for the JWT token.
export function getToken() {
  return sessionStorage.getItem("tone_token");
}

export function setToken(token: string) {
  sessionStorage.setItem("tone_token", token);
}

export function removeToken() {
  sessionStorage.removeItem("tone_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadFile(file: File): Promise<{ url: string; name: string; type: string } | null> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) return null;
  return res.json();
}
