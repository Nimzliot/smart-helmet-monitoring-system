import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest } from '../services/auth';

const AuthContext = createContext(null);
const STORAGE_KEY = 'smart-helmet-auth';

export function AuthProvider({ children }) {
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

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      async login(credentials) {
        const nextSession = await loginRequest(credentials);
        setSession(nextSession);
        return nextSession;
      },
      logout() {
        setSession(null);
      },
    }),
    [session]
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
