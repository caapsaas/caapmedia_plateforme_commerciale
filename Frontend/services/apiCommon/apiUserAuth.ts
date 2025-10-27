import { api } from '../api';
import { User, Subsidiary, UserRole } from '../../types';

/**
 * Interfaces pour les données d'authentification des utilisateurs (employés).
 */

export interface UserLoginCredentials {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  user: User;
  access_token: string;
  subsidiary: Subsidiary;
}

export interface UserRegisterResponse {
  message: string;
  userId: string;
}

export interface UserRegisterData {
  userName: string;
  email: string;
  password: string;
  userRole: UserRole;
  subsidiaryId: string;
}


export interface UserUpdateData {
  userName?: string;
  email?: string;
  password?: string;
  userRole?: UserRole;
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
 * Récupère tous les utilisateurs.
 * Protégé par un rôle ADMIN côté backend.
 * @returns Une liste d'utilisateurs.
 */
export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/auth/users');
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
  const { data } = await api.get<User[]>('/auth/users/search', { params: query });
  return data;
};

/**
 * Déclenche la procédure de mot de passe oublié.
 * @param email - L'email de l'utilisateur.
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};


// La fonction de déconnexion est gérée globalement dans AuthContext.
