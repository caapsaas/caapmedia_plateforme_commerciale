import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Subsidiary } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, subsidiaryId: string) => Promise<{ user: User, subsidiary: Subsidiary }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = async (email: string, password: string, subsidiaryId: string) => {
    const response = await fetch('https://www.caapmedia.com/api-caapsaas/auth/login', {  // Endpoint backend auth
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, subsidiaryId }), // subsidiaryId est maintenant envoyé
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la connexion');
    }

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      // Retourne les données pour que LoginPage puisse les dispatcher vers AppContext
      return { user: data.user, subsidiary: data.subsidiary };
    } else {
      throw new Error('Token d\'accès non reçu');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};