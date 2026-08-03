import { api } from '../api';
import { Contact, Order } from '../../types';
import { PaginatedResponse } from '../../types/pagination.types';

// --- Types pour les Employés (CRM Interne) ---

/**
 * Données pour la création d'un contact par un employé.
 * Les champs gérés par le backend sont omis.
 */
export type ContactCreationData = Omit<Contact, 'id' | 'subsidiaryId' | 'salesRepId' | 'createdAt' | 'updatedAt' | 'password' | 'passwordHash' | 'isVerified'>;

/**
 * Données pour la mise à jour d'un contact par un employé.
 */
export type ContactUpdateData = Partial<ContactCreationData>;

// --- Types pour le Portail Client ---

/**
 * Données pour l'auto-enregistrement d'un contact sur le portail.
 */
export type ContactRegisterData = Omit<Contact, 'id' | 'subsidiaryId' >;

/**
 * Identifiants pour la connexion d'un contact au portail.
 */
export interface ContactLoginCredentials {
  email: string;
  password: string;
}

/**
 * Réponse de la connexion d'un contact.
 */
export interface ContactLoginResponse {
  access_token: string;
  contact: Contact;
}

/**
 * Résultat d'une recherche globale de client (Chantier 6) — inclut la filiale
 * d'origine pour que le commercial sache d'où vient ce client avant de le
 * rattacher à une nouvelle commande dans sa propre filiale.
 */
export interface GlobalContactSearchResult {
  id: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  subsidiaryId: string;
  subsidiary: { subsidiaryName: string };
}

// --- Fonctions API pour les Employés (CRM Interne) ---

/**
 * Crée un nouveau contact (par un employé).
 * @param contactData - Les données du contact à créer.
 * @returns Le contact nouvellement créé.
 */
export const createContactByEmployee = async (contactData: ContactCreationData): Promise<Contact> => {
  const { data } = await api.post<Contact>('/crm/contacts', contactData);
  return data;
};

/**
 * Récupère la liste des contacts (filtrée par rôle côté backend).
 * Limit élevée pour préserver le comportement "tout charger" existant des
 * appelants (sélection client en caisse, nouvelle commande, etc.).
 * @returns Un tableau de contacts.
 */
export const getContacts = async (): Promise<Contact[]> => {
  const { data } = await api.get<PaginatedResponse<Contact>>('/crm/contacts', {
    params: { limit: 1000 },
  });
  return data.data;
};

/**
 * Recherche globale de clients par email/téléphone/nom, sans filtre de filiale
 * (Chantier 6) — pour retrouver et rattacher un client existant créé ailleurs.
 * @param query - Terme de recherche (email, téléphone ou nom).
 */
export const searchContactsGlobal = async (query: string): Promise<GlobalContactSearchResult[]> => {
  const { data } = await api.get<GlobalContactSearchResult[]>('/crm/contacts/search', {
    params: { q: query },
  });
  return data;
};

/**
 * Récupère un contact spécifique par son ID.
 * @param id - L'ID du contact.
 * @returns Les données du contact.
 */
export const getContactById = async (id: string): Promise<Contact> => {
  const { data } = await api.get<Contact>(`/crm/contacts/${id}`);
  return data;
};

/**
 * Récupère les informations publiques d'un contact (sans authentification).
 * @param id - L'ID du contact.
 * @returns Les informations de base du contact.
 */
export const getPublicContact = async (id: string): Promise<Contact> => {
  const { data } = await api.get<Contact>(`/crm/contacts/public/${id}`);
  return data;
};

/**
 * Met à jour un contact existant (par un employé).
 * @param id - L'ID du contact à mettre à jour.
 * @param updateData - Les champs à mettre à jour.
 * @returns Le contact mis à jour.
 */
export const updateContact = async (id: string, updateData: ContactUpdateData): Promise<Contact> => {
  const { data } = await api.patch<Contact>(`/crm/contacts/${id}`, updateData);
  return data;
};

/**
 * Supprime un contact par son ID (par un employé).
 * @param id - L'ID du contact à supprimer.
 * @returns Le contact qui a été supprimé.
 */
export const deleteContact = async (id: string): Promise<Contact> => {
  const { data } = await api.delete<Contact>(`/crm/contacts/${id}`);
  return data;
};

// --- Fonctions API pour le Portail Client ---

/**
 * Inscrit un contact via le portail public.
 * @param registerData - Les données d'inscription du contact.
 * @returns Le contact créé (sans le mot de passe).
 */
export const registerContact = async (registerData: ContactRegisterData): Promise<Omit<Contact, 'passwordHash'>> => {
  const { data } = await api.post<Omit<Contact, 'passwordHash'>>('/crm/contacts/register', registerData);
  return data;
};

/**
 * Connecte un contact via le portail public.
 * @param credentials - Email et mot de passe du contact.
 * @returns Un token d'accès.
 */
export const loginContact = async (credentials: ContactLoginCredentials): Promise<ContactLoginResponse> => {
  const { data } = await api.post<ContactLoginResponse>('/crm/contacts/login', credentials);
  return data;
};

/**
 * Déconnecte un contact via le portail public.
 * @returns Un message de confirmation.
 */
export const logoutContact = async (): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/crm/contacts/logout');
  return data;
};

/**
 * Récupère le profil du contact actuellement connecté au portail.
 * Nécessite un intercepteur Axios pour utiliser le token du contact.
 * @returns Le profil du contact.
 */
export const getContactProfile = async (): Promise<Omit<Contact, 'passwordHash'>> => {
  const { data } = await api.get<Omit<Contact, 'passwordHash'>>('/crm/contacts/profile');
  return data;
};

/**
 * Récupère les commandes du contact actuellement connecté au portail.
 * Nécessite un intercepteur Axios pour utiliser le token du contact.
 * @returns Une liste de commandes.
 */
export const getContactOrders = async (): Promise<Order[]> => {
  const { data } = await api.get<Order[]>('/crm/contacts/orders');
  return data;
};
