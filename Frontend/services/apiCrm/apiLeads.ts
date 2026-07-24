import { api } from '../api';

/**
 * Crée une nouvelle demande de devis (Lead).
 * Endpoint public - aucune authentification requise.
 * @param leadData - Les données du lead à créer en JSON.
 */
export const createQuoteRequest = async (leadData: {
    leadName: string;
    company: string;
    email: string;
    phone: string;
    description?: string;
}) => {
    const { data } = await api.post('/crm/leads/quote-request', leadData);
    return data;
};