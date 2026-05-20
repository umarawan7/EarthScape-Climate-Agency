import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const MOCK_USERS = {
  admin:   { id: 1, name: 'Dr. Sarah Mitchell', email: 'admin@earthscape.io',   role: 'admin',   initials: 'SM' },
  analyst: { id: 2, name: 'James Okafor',       email: 'analyst@earthscape.io', role: 'analyst', initials: 'JO' },
  viewer:  { id: 3, name: 'Priya Sharma',        email: 'viewer@earthscape.io',  role: 'viewer',  initials: 'PS' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (role = 'admin') => {
    setUser(MOCK_USERS[role] || MOCK_USERS.admin);
  };

  const logout = () => setUser(null);

  const isAdmin   = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isAnalyst }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
