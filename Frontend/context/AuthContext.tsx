import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Contact, Subsidiary} from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  contact: Contact | null;
  token: string | null;
  subsidiary: Subsidiary | null, 
  login: (data: { user: User; token: string, subsidiary: Subsidiary}) => void;
  logout: () => void;
  logoutCustomer: () => void;
  loginCustomer: (contact: { contact: Contact; access_token: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [contact, setContact] = useState<AuthContextType['contact']>(null);
  const [subsidiary, setSubsidiary] = useState<AuthContextType['subsidiary']>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [contactToken, setContactToken] = useState<string | null>(localStorage.getItem('contactToken'));

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
  }, [token]);

  useEffect(() => {
    const fetchContact = async () => {
      if (contactToken) {
        try {
          const response = await api.get('/crm/contacts/profile');
          setContact(response.data);
        } catch (error) {
          console.error("Failed to fetch contact profile", error);
          logoutCustomer();
        }
      }
    }
    fetchContact();
  }, [contactToken]);

  const login = (data: { user: User; token: string , subsidiary: Subsidiary}) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setSubsidiary(data.subsidiary);
  };

  const loginCustomer = (contact: { contact: Contact; access_token: string }) => {
    localStorage.setItem('contactToken', contact.access_token);
    setContactToken(contact.access_token);
    setContact(contact.contact);
  };

  const logoutCustomer = () => {
    localStorage.removeItem('contactToken');
    setContactToken(null);
    setContact(null);
  };

  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, contact, token, subsidiary, login, logout, loginCustomer, logoutCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};