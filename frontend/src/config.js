const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

const getBackendBaseUrl = () => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    const port = import.meta.env.VITE_BACKEND_PORT || '5000';
    return `${protocol}//${hostname}:${port}`;
  }

  return 'http://localhost:5000';
};

export const backendBaseUrl = getBackendBaseUrl();

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBaseUrl}${normalizedPath}`;
};

export const socketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || backendBaseUrl;
