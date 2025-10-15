import { api } from '../api';

/**
 * Crée une nouvelle demande de devis (Lead).
 * Utilise FormData pour gérer l'upload de fichiers potentiels.
 * @param leadData - Les données du lead à créer, sous forme de FormData.
 */
export const createQuoteRequest = async (leadData: FormData) => {
    const { data } = await api.post('/leads/quote-request', leadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};