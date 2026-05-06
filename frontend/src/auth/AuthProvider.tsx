import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../lib/api/client';
import { setAccessToken } from './tokenStore';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await client.get('/users/me');
        setUser({ id: res.data.data._id, name: res.data.data.name, role: res.data.data.role });
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    const handleLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = (token: string, user: User) => {
    setAccessToken(token);
    setUser(user);
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Ignore logout request failures and clear local auth state anyway.
    }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
