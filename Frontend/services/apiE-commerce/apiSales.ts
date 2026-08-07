import { api } from '../api';
import { CustomerPaymentMethod, Sale } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

/**
 * DTO pour la création d'une vente directe, correspondant à CreateDirectSaleDto du backend.
 */
export interface CreateDirectSaleDto {
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number; // Prix négocié au comptoir, jamais tiré du catalogue.
        discount?: number;
        assemblyPrice?: number;
        specValues?: Record<string, unknown>; // Spécifications techniques (Chantier 5)
    }[];
    paymentMethod: CustomerPaymentMethod;
    customerId: string;
    applyTax?: boolean;
    bankAccountId?: string;        // Compte bancaire (obligatoire si BANK_TRANSFER / CARD / CHECK)
    transactionReference?: string; // Référence de transaction (n° chèque, ref virement, etc.)
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
 * Limit élevée : Sales.tsx trie/filtre côté client sur le jeu complet.
 * @param query - Les paramètres de filtrage des ventes.
 */
export const getSales = async (query?: FindAllSalesDto): Promise<Sale[]> => {
    const { data } = await api.get<PaginatedResponse<Sale>>('/ecommerce/sales', { params: { ...query, limit: 500 } });
    return data.data;
};

/**
 * Version paginée/recherchable (page/limit/search) pour un futur usage en
 * pagination cliquable réelle.
 */
export const getSalesPaginated = async (
    query: FindAllSalesDto & PaginationParams,
): Promise<PaginatedResponse<Sale>> => {
    const { data } = await api.get<PaginatedResponse<Sale>>('/ecommerce/sales', { params: query });
    return data;
};