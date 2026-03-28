import { apiUrl } from '../config';

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

export async function apiRequest(path, options = {}) {
  const auth = options.skipAuth ? null : JSON.parse(localStorage.getItem('smart-helmet-auth') || 'null');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const token = options.token || auth?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }

  return data;
}
