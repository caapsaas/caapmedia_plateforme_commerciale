import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Contact, Subsidiary, UserRole} from '../types';
import { api } from '../services/api';
import { logoutUser as apiLogoutUser } from '../services/apiCommon/apiUserAuth';

const SIDEBAR_OPEN_KEY = 'caap-isSidebarOpen';
const SIDEBAR_COLLAPSED_KEY = 'caap-isSidebarCollapsed';

interface AuthContextType {
  user: User | null;
  contact: Contact | null;
  /** true une fois qu'on sait si une session (cookie httpOnly) est active ou non - a attendre avant toute redirection basee sur isAuthenticated. */
  isAuthResolved: boolean;
  isAuthenticated: boolean;
  contactToken: string | null;
  subsidiary: Subsidiary | null,
  updateUserRole: (newRole: UserRole) => void;
  login: (data: { user: User; subsidiary: Subsidiary }) => void;
  logout: () => void;
  logoutCustomer: () => void;
  loginCustomer: (contact: { contact: Contact; access_token: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [contact, setContact] = useState<AuthContextType['contact']>(null);
  const [subsidiary, setSubsidiary] = useState<AuthContextType['subsidiary']>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [contactToken, setContactToken] = useState<string | null>(localStorage.getItem('contactToken'));

  // Le token "user" vit desormais dans un cookie httpOnly, illisible en JS -
  // on ne peut savoir si une session est active qu'en interrogeant le
  // serveur. Tente une seule fois au montage; le navigateur envoie le cookie
  // automatiquement (withCredentials, voir services/api.ts).
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.get<{ user: User, subsidiary: Subsidiary }>('/auth/Userprofile');
        setUser(response.data.user);
        setSubsidiary(response.data.subsidiary);
      } catch (error) {
        setUser(null);
        setSubsidiary(null);
      } finally {
        setIsAuthResolved(true);
      }
    };
    restoreSession();
  }, []);

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

  const login = (data: { user: User; subsidiary: Subsidiary }) => {
    // Les cookies httpOnly (access_token, refresh_token, csrf_token) sont
    // deja poses par le serveur au moment ou cette fonction est appelee
    // (reponse de POST /auth/login) - rien a stocker cote client.
    setUser(data.user);
    setSubsidiary(data.subsidiary);
    setIsAuthResolved(true);
  };

  const loginCustomer = (contact: { contact: Contact; access_token: string }) => {
    localStorage.setItem('contactToken', contact.access_token);
    setContactToken(contact.access_token);
    setContact(contact.contact);
  };

  const updateUserRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, userRole: newRole });
    }
  };

  const logoutCustomer = () => {
    localStorage.removeItem('contactToken');
    setContactToken(null);
    setContact(null);
  };


  const logout = () => {
    setUser(null);
    setSubsidiary(null);
    // On nettoie aussi le localStorage de l'UI ici
    localStorage.removeItem(SIDEBAR_OPEN_KEY);
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    // Invalide le refresh token cote serveur et efface les cookies httpOnly.
    // Fire-and-forget: l'UI se deconnecte immediatement quoi qu'il arrive,
    // l'appel serveur est une best-effort (le cookie expirera de toute facon).
    apiLogoutUser().catch(() => {});
    // Le routeur redirigera automatiquement vers /login via le beforeLoad
  };

  return (
    <AuthContext.Provider value={{ user, contact, isAuthResolved, isAuthenticated: !!user, contactToken, subsidiary, login, logout, loginCustomer, logoutCustomer, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
