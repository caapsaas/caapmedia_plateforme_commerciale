import { api } from '../api';
import { CustomerPaymentMethod, Sale } from '../../types';

/**
 * DTO pour la création d'une vente directe, correspondant à CreateDirectSaleDto du backend.
 */
export interface CreateDirectSaleDto {
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number; // Prix négocié au comptoir, jamais tiré du catalogue.
        specValues?: Record<string, unknown>; // Spécifications techniques (Chantier 5)
    }[];
    paymentMethod: CustomerPaymentMethod;
    customerId: string;
}

/**
 * DTO pour le filtrage des ventes, correspondant à FindAllSalesDto du backend.
 */
export interface FindAllSalesDto {
    customerId?: string;
    salesRepId?: string;
    paymentMethod?: CustomerPaymentMethod;
    // Valeurs (pas les cles) de l'enum OrderPeriod backend - IsEnum() les
    // valide telles quelles, en minuscules.
    period?: 'all_time' | 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';
    startDate?: string;
    endDate?: string;
}

/**
 * Crée une nouvelle vente directe (vente au comptoir).
 * @param saleData - Les données de la vente à créer.
 */
export const createDirectSale = async (saleData: CreateDirectSaleDto): Promise<{ message: string }> => {
    const { data } = await api.post('/ecommerce/sales/direct', saleData);
    return data;
};

/**
 * Récupère toutes les ventes directes avec des options de filtrage.
 * @param query - Les paramètres de filtrage des ventes.
 */
export const getSales = async (query?: FindAllSalesDto): Promise<Sale[]> => {
    const { data } = await api.get<Sale[]>('/ecommerce/sales', { params: query });
    return data;
};