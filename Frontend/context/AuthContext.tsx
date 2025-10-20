import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Contact } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  contact: Contact | null;
  token: string | null;
  login: (data: { user: User; token: string }) => void;
  logout: () => void;
  loginCustomer: (contact: {contact: Contact; token: string}) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [contact, setContact] = useState<AuthContextType['contact']>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          if (response.data) {
            setUser(response.data);
          } else {
            // Token invalide ou expiré
            logout();
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          logout();
        }
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    const fetchContact = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/contact/profile');
          if (response.data) {
            setContact(response.data);
          } else {
            // Token invalide ou expiré
            logout();
          }
        } catch (error) {
          console.error("Failed to fetch contact profile", error);
          logout();
        }
      }
    };
    fetchContact();
  }, [token]);

  const login = (data: { user: User; token: string }) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginCustomer = (contact: {contact: Contact; token: string}) => {
    localStorage.setItem('token', contact.token);
    setToken(contact.token);
    setContact(contact.contact);
  };
    

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setContact(null);
  };

  return (
    <AuthContext.Provider value={{ user, contact,token, login, logout, loginCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};