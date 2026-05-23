const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function buildHeaders(token, extra = {}) {
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiRequest(path, { method = 'GET', token, headers = {}, body, isFormData = false } = {}) {
  const requestHeaders = buildHeaders(token, headers);
  if (!isFormData) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: body
      ? isFormData
        ? body
        : typeof body === 'string'
          ? body
          : JSON.stringify(body)
      : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload?.detail ? payload.detail : 'Request failed';
    const error = new Error(detail);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getApiBase() {
  return API_BASE;
}
