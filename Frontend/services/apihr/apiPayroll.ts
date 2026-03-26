import { api } from '../api';
import { PayrollRecord } from '../../types';

/**
 * Données pour la création d'une fiche de paie.
 * Les champs gérés par le backend sont omis.
 */
export type PayrollRecordCreationData = Omit<PayrollRecord, 'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt'>;

/**
 * Données pour la mise à jour d'une fiche de paie.
 */
export type PayrollRecordUpdateData = Partial<PayrollRecordCreationData>;

/**
 * Récupère toutes les fiches de paie pour la filiale de l'utilisateur connecté.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const getPayrollRecords = async (): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PayrollRecord[]>('/hr/payroll-records');
  return data;
};

/**
 * Récupère une fiche de paie spécifique par son ID.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const getPayrollRecordById = async (id: string): Promise<PayrollRecord> => {
  const { data } = await api.get<PayrollRecord>(`/hr/payroll-records/${id}`);
  return data;
};

/**
 * Crée ou met à jour une fiche de paie.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param payrollData - Les données de la fiche de paie.
 */
export const savePayrollRecord = async (payrollData: Partial<PayrollRecord>): Promise<PayrollRecord> => {
  return payrollData.id
    ? (await api.patch<PayrollRecord>(`/hr/payroll-records/${payrollData.id}`, payrollData)).data
    : (await api.post<PayrollRecord>('/hr/payroll-records', payrollData)).data;
};

/**
 * Supprime une fiche de paie par son ID.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const deletePayrollRecord = async (id: string): Promise<PayrollRecord> => {
  const { data } = await api.delete<PayrollRecord>(`/hr/payroll-records/${id}`);
  return data;
};

export const processPayroll = async (data: { period: string }): Promise<{ count: number }> => {
  return (await api.post('/hr/payroll-records/process', data)).data;
};

/**
 * Signe une fiche de paie avec la signature de l'employé.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param payrollId - L'ID de la fiche de paie.
 * @param signature - La signature (base64).
 */
export const signPayrollRecord = async (data: { payrollId: string; signature: string }): Promise<PayrollRecord> => {
  return (await api.patch<PayrollRecord>(`/hr/payroll-records/${data.payrollId}/sign`, { signature: data.signature })).data;
};
