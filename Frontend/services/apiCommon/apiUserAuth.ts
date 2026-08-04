import { api } from '../api';
import { User, Subsidiary, UserRole } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

/**
 * Interfaces pour les données d'authentification des utilisateurs (employés).
 */

export interface UserLoginCredentials {
  email: string;
  password: string;
}

export interface UserLoginSuccess {
  twoFactorRequired: false;
  user: User;
  subsidiary: Subsidiary;
}

export interface UserLoginTwoFactorRequired {
  twoFactorRequired: true;
  pendingToken: string;
}

export type UserLoginResponse = UserLoginSuccess | UserLoginTwoFactorRequired;

export interface UserRegisterResponse {
  message: string;
  userId: string;
}

export interface UserRegisterData {
  userName: string;
  email: string;
  password: string;
  userRole: UserRole;
  additionalRoles?: UserRole[];
  subsidiaryId: string;
}


export interface UserUpdateData {
  userName?: string;
  email?: string;
  password?: string;
  userRole?: UserRole;
  additionalRoles?: UserRole[];
  subsidiaryId?: string;
}

export interface UserSearchQuery {
  email?: string;
  userName?: string;
  userRole?: UserRole;
}

/**
 * Fonctions d'API pour l'authentification et la gestion des utilisateurs.
 */

/**
 * Connecte un utilisateur (employé).
 * @param credentials - Informations de connexion.
 * @returns Les données de l'utilisateur, de la filiale et le token d'accès.
 */
export const loginUser = async (credentials: UserLoginCredentials): Promise<UserLoginResponse> => {
  const { data } = await api.post<UserLoginResponse>('/auth/login', credentials);
  return data;
};

/**
 * Complete le login quand loginUser() a renvoye twoFactorRequired: true.
 * Un seul de `code` (TOTP) ou `recoveryCode` doit être fourni.
 */
export const completeTwoFactorLogin = async (
  pendingToken: string,
  credentials: { code?: string; recoveryCode?: string },
): Promise<{ user: User; subsidiary: Subsidiary }> => {
  const { data } = await api.post<{ user: User; subsidiary: Subsidiary }>('/auth/2fa/login', {
    pendingToken,
    ...credentials,
  });
  return data;
};

/**
 * Inscrit un nouvel utilisateur (employé).
 * Protégé par un rôle ADMIN côté backend.
 * @param userData - Données du nouvel utilisateur.
 * @returns L'utilisateur créé.
 */
export const registerUser = async (userData: UserRegisterData): Promise<UserRegisterResponse> => {
  const { data } = await api.post<UserRegisterResponse>('/auth/register', userData);
  return data;
};

/**
 * Récupère tous les utilisateurs. Limit élevée : alimente les selects
 * commerciaux (Sales.tsx, Crm.tsx) qui ont besoin du jeu complet.
 * Protégé par un rôle ADMIN côté backend.
 * @returns Une liste d'utilisateurs.
 */
export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await api.get<PaginatedResponse<User>>('/auth/users', { params: { limit: 500 } });
  return data.data;
};

/**
 * Version paginée/recherchable (page/limit) pour la vue de gestion des
 * utilisateurs (pagination cliquable réelle).
 */
export const getUsersPaginated = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<User>> => {
  const { data } = await api.get<PaginatedResponse<User>>('/auth/users', { params });
  return data;
};

/**
 * Met à jour un utilisateur.
 * Protégé par un rôle ADMIN côté backend.
 * @param id - ID de l'utilisateur à mettre à jour.
 * @param updateData - Données à mettre à jour.
 * @returns L'utilisateur mis à jour.
 */
export const updateUser = async (id: string, updateData: UserUpdateData): Promise<User> => {
  const { data } = await api.patch<User>(`/auth/users/${id}`, updateData);
  return data;
};

/**
 * Supprime un utilisateur.
 * Protégé par un rôle ADMIN côté backend.
 * @param id - ID de l'utilisateur à supprimer.
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/auth/users/${id}`);
};

/**
 * Recherche des utilisateurs selon des critères.
 * Protégé par un rôle ADMIN côté backend.
 * @param query - Critères de recherche.
 * @returns Une liste d'utilisateurs correspondants.
 */
export const searchUsers = async (query: UserSearchQuery): Promise<User[]> => {
  const { data } = await api.get<PaginatedResponse<User>>('/auth/users/search', { params: { ...query, limit: 500 } });
  return data.data;
};

/**
 * Déclenche la procédure de mot de passe oublié.
 * @param email - L'email de l'utilisateur.
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

/**
 * Déconnecte l'utilisateur (côté serveur).
 */
export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
};

/**
 * Récupère le profil de l'utilisateur connecté avec sa filiale.
 * Endpoint: /auth/Userprofile
 */
export const getUserProfile = async (): Promise<{ user: User; subsidiary: Subsidiary }> => {
  const { data } = await api.get<{ user: User; subsidiary: Subsidiary }>('/auth/Userprofile');
  return data;
};

/**
 * Récupère les détails complets du profil de l'utilisateur.
 * Endpoint: /auth/profile
 */
export const getProfile = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/profile');
  return data;
};

/**
 * Change le rôle actif d'un utilisateur multi-rôle. Effectif immédiatement
 * côté backend (RoleGuard/checkRole n'autorisent que ce rôle-ci tant qu'il
 * n'est pas re-switché), pas seulement un changement d'affichage.
 */
export const switchRole = async (role: UserRole): Promise<{ user: User }> => {
  const { data } = await api.post<{ user: User }>('/auth/switch-role', { role });
  return data;
};
