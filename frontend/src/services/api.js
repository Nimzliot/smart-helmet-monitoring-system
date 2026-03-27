import { apiUrl } from '../config';

const readJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export async function apiRequest(path, options = {}) {
  const auth = JSON.parse(localStorage.getItem('smart-helmet-auth') || 'null');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}
