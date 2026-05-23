import { apiRequest } from './api';

export function loginRequest(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function refreshRequest(refreshToken) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
}

export function meRequest(token) {
  return apiRequest('/auth/me', { token });
}

export function registerRequest(token, payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function selfRegisterRequest(payload) {
  return apiRequest('/auth/self-register', {
    method: 'POST',
    body: payload,
  });
}

export function resetPasswordRequest(email, newPassword) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { email, new_password: newPassword },
  });
}

