import { api } from '../api';
import { ProformaStatus } from '../../types';

export interface ProformaItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface CreateProformaData {
  leadId: string;
  opportunityId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  items: ProformaItem[];
  taxRate: number;
  validityDays?: number;
  notes?: string;
}

export interface Proforma {
  id: string;
  proformaNumber: string;
  leadId: string;
  opportunityId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  items: any[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: ProformaStatus;
  validityDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
}

// Créer une proforma
export const createProforma = async (data: CreateProformaData): Promise<Proforma> => {
  const { data: response } = await api.post('/crm/proformas', data);
  return response;
};

// Récupérer toutes les proformas
export const getProformas = async (status?: ProformaStatus): Promise<Proforma[]> => {
  const params = status ? { status } : {};
  const { data } = await api.get('/crm/proformas', { params });
  return data;
};

// Récupérer une proforma spécifique
export const getProforma = async (id: string): Promise<Proforma> => {
  const { data } = await api.get(`/crm/proformas/${id}`);
  return data;
};

// Mettre à jour une proforma
export const updateProforma = async (id: string, data: Partial<CreateProformaData>): Promise<Proforma> => {
  const { data: response } = await api.patch(`/crm/proformas/${id}`, data);
  return response;
};

// Envoyer une proforma
export const sendProforma = async (id: string): Promise<Proforma> => {
  const { data } = await api.post(`/crm/proformas/${id}/send`);
  return data;
};

// Marquer comme vue
export const markProformaAsViewed = async (id: string): Promise<Proforma> => {
  const { data } = await api.post(`/crm/proformas/${id}/mark-viewed`);
  return data;
};

// Accepter une proforma
export const acceptProforma = async (id: string): Promise<Proforma> => {
  const { data } = await api.post(`/crm/proformas/${id}/accept`);
  return data;
};

// Refuser une proforma
export const rejectProforma = async (id: string): Promise<Proforma> => {
  const { data } = await api.post(`/crm/proformas/${id}/reject`);
  return data;
};

// Supprimer une proforma
export const deleteProforma = async (id: string): Promise<any> => {
  const { data } = await api.delete(`/crm/proformas/${id}`);
  return data;
};
