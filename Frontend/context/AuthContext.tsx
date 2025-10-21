import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useAppContext } from './AppContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: { user: User; token: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const { dispatch: appDispatch } = useAppContext();
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    appDispatch({ type: 'LOGOUT' }); // ✅ On synchronise AppContext ici
  }, [appDispatch]);

  useEffect(() => {
    const fetchUser = async () => {
      // Si pas de token, on ne fait rien.
      if (!token) {
        setUser(null); // Assurer que l'utilisateur est bien déconnecté
        return;
      }

      try {
        const response = await api.get('/auth/Userprofile');
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user profile, logging out.", error);
        // Si l'appel échoue (ex: token expiré -> 401), on déconnecte l'utilisateur.
        logout();
      }
    };
    fetchUser();
  }, [token, logout]);

const login = (data: { user: User; token: string }) => {
  sessionStorage.setItem('token', data.token);
  setToken(data.token);
  setUser(data.user);
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