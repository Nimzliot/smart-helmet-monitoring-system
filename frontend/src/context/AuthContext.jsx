import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, meRequest } from '../services/auth';

const AuthContext = createContext(null);
const STORAGE_KEY = 'smart-helmet-auth';

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!session?.token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await meRequest(session.token);
        if (!cancelled) {
          setSession((current) => (current ? { ...current, user: response.user } : current));
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      isLoading,
      async login(credentials) {
        const nextSession = await loginRequest(credentials);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        return nextSession;
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      },
    }),
    [isLoading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
