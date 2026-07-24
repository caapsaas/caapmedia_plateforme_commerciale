import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Contact, Subsidiary, UserRole} from '../types';
import { api } from '../services/api';
import { logoutUser as apiLogoutUser, switchRole as apiSwitchRole } from '../services/apiCommon/apiUserAuth';

const SIDEBAR_OPEN_KEY = 'caap-isSidebarOpen';
const SIDEBAR_COLLAPSED_KEY = 'caap-isSidebarCollapsed';

interface AuthContextType {
  user: User | null;
  contact: Contact | null;
  /** true une fois qu'on sait si une session (cookie httpOnly) est active ou non - a attendre avant toute redirection basee sur isAuthenticated. */
  isAuthResolved: boolean;
  isAuthenticated: boolean;
  /**
   * Ref stable (identite constante entre renders) miroitant isAuthResolved/
   * isAuthenticated en temps reel. A lire depuis router.tsx (beforeLoad) au
   * lieu des champs ci-dessus: le contexte passe a beforeLoad est un
   * instantane fige au moment de l'invocation - sur un refresh direct sur
   * /dashboard/*, ce beforeLoad demarre AVANT que restoreSession() ait fini,
   * et son instantane de isAuthResolved reste a `false` pour toujours (React
   * recree un nouvel objet contexte a chaque render, l'ancien ne mute jamais
   * en place). Un ref survit a ca: sa reference ne change jamais, seul
   * `.current` est mis a jour, donc meme un instantane fige y voit la valeur
   * la plus recente.
   */
  authLive: React.MutableRefObject<{ isAuthResolved: boolean; isAuthenticated: boolean; activeRole: UserRole | undefined }>;
  contactToken: string | null;
  subsidiary: Subsidiary | null,
  updateUserRole: (newRole: UserRole) => void;
  /** Change le role actif d'un utilisateur multi-role via POST /auth/switch-role (enforce cote backend, pas un simple affichage). */
  switchRole: (newRole: UserRole) => Promise<void>;
  setTwoFactorEnabled: (enabled: boolean) => void;
  login: (data: { user: User; subsidiary: Subsidiary }) => void;
  logout: () => void;
  logoutCustomer: () => void;
  loginCustomer: (contact: { contact: Contact; access_token: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [contact, setContact] = useState<AuthContextType['contact']>(null);
  const [subsidiary, setSubsidiary] = useState<AuthContextType['subsidiary']>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [contactToken, setContactToken] = useState<string | null>(localStorage.getItem('contactToken'));

  const authLive = useRef<{ isAuthResolved: boolean; isAuthenticated: boolean; activeRole: UserRole | undefined }>({ isAuthResolved: false, isAuthenticated: false, activeRole: undefined });
  authLive.current = { isAuthResolved, isAuthenticated: !!user, activeRole: user?.activeRole ?? user?.userRole };

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
    //
    // Purge le cache React Query AVANT d'appliquer la nouvelle session: les
    // queryKey des pages (ex: Analytics.tsx: ['dashboardStats', queryParams])
    // ne sont pas scopees par utilisateur/filiale, donc sans ca, se
    // reconnecter (meme utilisateur ou un autre) dans le meme onglet sert
    // d'abord les donnees en cache de la session precedente (obsoletes)
    // avant un refetch en arriere-plan - d'ou l'impression que "le contexte
    // ne se met pas a jour" juste apres la connexion.
    queryClient.clear();
    // Synchrone, meme raison que dans switchRole() ci-dessous: garantit que
    // authLive est a jour des cette fonction retournee, sans dependre du
    // timing du re-render React.
    authLive.current = { isAuthResolved: true, isAuthenticated: true, activeRole: data.user.activeRole ?? data.user.userRole };
    setUser(data.user);
    setSubsidiary(data.subsidiary);
    setIsAuthResolved(true);
  };

  const switchRole = async (newRole: UserRole) => {
    // Purge le cache React Query: les donnees deja chargees (ex: listes CRM
    // scopees par commercial) peuvent dependre du role actif precedent -
    // meme raison que dans login()/logout().
    const { user: updatedUser } = await apiSwitchRole(newRole);
    queryClient.clear();
    // Met a jour authLive.current de facon SYNCHRONE, sans attendre le
    // re-render de AuthProvider declenche par setUser(): l'appelant
    // (Header.tsx::handleRoleChange) enchaine sur router.navigate() juste
    // apres, potentiellement avant que React n'ait re-rendu et propage le
    // nouveau role jusqu'au contexte du routeur - le beforeLoad de la route
    // ciblee (ex: dashboardIndexRoute qui verifie ANALYTICS_ALLOWED_ROLES)
    // risquerait alors de lire encore l'ancien role.
    authLive.current = { ...authLive.current, activeRole: updatedUser.activeRole ?? updatedUser.userRole };
    setUser(updatedUser);
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

  const setTwoFactorEnabled = (enabled: boolean) => {
    if (user) {
      setUser({ ...user, twoFactorEnabled: enabled });
    }
  };

  const logoutCustomer = () => {
    localStorage.removeItem('contactToken');
    setContactToken(null);
    setContact(null);
  };


  const logout = () => {
    // Meme raison que dans login(): eviter qu'une donnee mise en cache pour
    // cet utilisateur/filiale ne fuite vers la prochaine session ouverte
    // dans le meme onglet.
    queryClient.clear();
    setUser(null);
    setSubsidiary(null);
    // On nettoie aussi le localStorage de l'UI ici
    localStorage.removeItem(SIDEBAR_OPEN_KEY);
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    // Invalide le refresh token cote serveur et efface les cookies httpOnly.
    // Fire-and-forget: l'UI se deconnecte immediatement quoi qu'il arrive,
    // l'appel serveur est une best-effort (le cookie expirera de toute facon).
    apiLogoutUser().catch(() => {});
    // Ne navigue PAS ici: cette fonction est appelee depuis un composant
    // rendu par le routeur (Header.tsx, App.tsx) - c'est a l'appelant de
    // naviguer vers /login explicitement apres l'appel (useNavigate() n'est
    // pas utilisable ici, AuthProvider est un ANCETRE de RouterProvider, pas
    // un descendant). TanStack Router ne re-evalue PAS automatiquement le
    // beforeLoad d'une route deja resolue juste parce que ce contexte change
    // de facon reactive - se fier a ça laissait l'utilisateur bloque sur
    // /dashboard apres un clic sur "deconnexion".
  };

  return (
    <AuthContext.Provider value={{ user, contact, isAuthResolved, isAuthenticated: !!user, authLive, contactToken, subsidiary, login, logout, loginCustomer, logoutCustomer, updateUserRole, switchRole, setTwoFactorEnabled }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
