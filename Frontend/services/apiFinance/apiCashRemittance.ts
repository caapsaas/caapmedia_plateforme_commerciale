import { api } from '../api';
import { CashRemittance } from '../../types';

export interface CreateCashRemittanceData {
  declaredAmount: number;
  remittanceDate: string;
  notes?: string;
}

export interface ReceiveCashRemittanceData {
  receivedAmount: number;
  notes?: string;
}

/**
 * Crée une nouvelle remise de caisse (CAISSIER uniquement — depuis sa propre
 * caisse assignée, résolue côté backend).
 */
export const createCashRemittance = async (
  data: CreateCashRemittanceData,
): Promise<CashRemittance> => {
  const { data: remittance } = await api.post<CashRemittance>('/finance/cash-remittances', data);
  return remittance;
};

/**
 * Liste les remises de caisse — scope automatique côté backend (CAISSIER :
 * les siennes ; Directeur Financier : celles de sa filiale ; SUPER_ADMIN : toutes).
 */
export const getCashRemittances = async (): Promise<CashRemittance[]> => {
  const { data } = await api.get<CashRemittance[]>('/finance/cash-remittances');
  return data;
};

/**
 * Réceptionne une remise de caisse soumise (Directeur Financier de la
 * filiale de la caisse source uniquement).
 */
export const receiveCashRemittance = async (
  id: string,
  data: ReceiveCashRemittanceData,
): Promise<CashRemittance> => {
  const { data: remittance } = await api.patch<CashRemittance>(
    `/finance/cash-remittances/${id}/receive`,
    data,
  );
  return remittance;
};
