import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, meRequest, refreshRequest } from '../services/authService';

const ACCESS_TOKEN_KEY = 'earthscape_access_token';
const REFRESH_TOKEN_KEY = 'earthscape_refresh_token';

const AuthContext = createContext(null);

function buildInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'US';
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem(REFRESH_TOKEN_KEY));
  const [authLoading, setAuthLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const persistSession = (tokens) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
  };

  const hydrateUser = async (token) => {
    const profile = await meRequest(token);
    setUser({ ...profile, initials: buildInitials(profile?.name) });
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!accessToken) {
        setAuthLoading(false);
        return;
      }

      try {
        await hydrateUser(accessToken);
      } catch (error) {
        if (error?.status === 401 && refreshToken) {
          try {
            const refreshed = await refreshRequest(refreshToken);
            persistSession(refreshed);
            await hydrateUser(refreshed.access_token);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email, password) => {
    const tokens = await loginRequest(email, password);
    persistSession(tokens);
    await hydrateUser(tokens.access_token);
  };

  const logout = () => {
    clearSession();
  };

  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst' || isAdmin;
  const isViewer = user?.role === 'viewer';

  const value = useMemo(() => ({
    user,
    login,
    logout,
    updateUser: (updatedFields) => setUser((prev) => ({ ...prev, ...updatedFields, initials: buildInitials(updatedFields?.name || prev?.name) })),
    accessToken,
    refreshToken,
    authLoading,
    isAdmin,
    isAnalyst,
    isViewer,
  }), [user, accessToken, refreshToken, authLoading, isAdmin, isAnalyst, isViewer]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
