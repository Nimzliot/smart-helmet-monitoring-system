import { apiRequest } from './api';

export function loginRequest(credentials) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function meRequest(token) {
  return apiRequest('/api/auth/me', {
    method: 'GET',
    token,
  });
}
