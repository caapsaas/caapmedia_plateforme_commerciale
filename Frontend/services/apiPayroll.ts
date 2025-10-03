import { api } from '../services/api';
import { PayrollRecord } from '../types';

/**
 * Récupère les fiches de paie pour une période donnée (mois/année).
 * @param period - La période au format YYYY-MM.
 */
export const getPayrollRecords = async (period: string): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PayrollRecord[]>('/hr/payroll', { params: { period } });
  return data;
};

/**
 * Lance le traitement de la paie pour une période donnée.
 * @param period - La période au format YYYY-MM.
 */
export const processPayrollForPeriod = async (period: string): Promise<{ message: string; count: number }> => {
  const { data } = await api.post<{ message: string; count: number }>(`/hr/payroll/process`, { period });
  return data;
};

/**
 * Met à jour le statut d'une fiche de paie (ex: marquer comme payée) et enregistre la signature.
 * @param recordId - L'ID de la fiche de paie.
 * @param signature - Les données de la signature de l'employé.
 */
export const signAndPayPayrollRecord = async (recordId: string, signature: string): Promise<PayrollRecord> => {
  const { data } = await api.patch<PayrollRecord>(`/hr/payroll/${recordId}/pay`, { signature });
  return data;
};
