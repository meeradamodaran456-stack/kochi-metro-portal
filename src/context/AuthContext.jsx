import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('km_token');
    const userStr = localStorage.getItem('km_user');
    if (token && userStr) {
      try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await client.post('/auth/login', { username, password });
    localStorage.setItem('km_token', data.token);
    localStorage.setItem('km_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
