import { api } from '../api';
import { PayrollRecord } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

export interface PayrollConfig {
  id: string;
  subsidiaryId: string;
  minWage: number;
  minWagePeriod?: string;
  minWageEffectiveDate: string;
  cnpsEmployeeRate?: number;
  cnpsEmployerRate?: number;
  taxBrackets?: TaxBracket[];
  salaryComponents?: any[];
  allowanceRules?: any[];
  irppBrackets?: TaxBracket[];
  leaveEntitlements?: LeaveEntitlement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxBracket {
  id?: string;
  minSalary?: number;
  maxSalary?: number | null;
  minAmount?: number;
  maxAmount?: number | null;
  rate: number;
  deductible?: number;
  effectiveDate?: string;
  expiryDate?: string | null;
}

export interface LeaveEntitlement {
  id?: string;
  type: string;
  daysPerYear: number;
  isPaid: boolean;
  description?: string;
}

export interface UpdatePayrollConfigDto {
  minWage?: number;
  minWagePeriod?: string;
  minWageEffectiveDate?: string;
  cnpsEmployeeRate?: number;
  cnpsEmployerRate?: number;
  irppBrackets?: TaxBracket[];
  leaveEntitlements?: LeaveEntitlement[];
}

export const getPayrollConfiguration = async (subsidiaryId: string): Promise<PayrollConfig> => {
  try {
    // Essayer d'abord le endpoint avec /full
    const { data } = await api.get<PayrollConfig>(`/configuration/payroll/${subsidiaryId}/full`);
    return data;
  } catch (error: any) {
    // Fallback au endpoint simple si /full n'existe pas
    if (error.response?.status === 404) {
      const { data } = await api.get<PayrollConfig>(`/configuration/payroll/${subsidiaryId}`);
      return data;
    }
    throw error;
  }
};

export const getFullPayrollConfiguration = async (subsidiaryId: string): Promise<PayrollConfig> => {
  return getPayrollConfiguration(subsidiaryId);
};

export const updatePayrollConfiguration = async (
  subsidiaryId: string,
  config: UpdatePayrollConfigDto
): Promise<PayrollConfig> => {
  const { data } = await api.put<PayrollConfig>(
    `/configuration/payroll/${subsidiaryId}`,
    config
  );
  return data;
};

/**
 * Récupère tous les enregistrements de paie pour la filiale de l'utilisateur connecté.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 */
export const getPayrollRecords = async (): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PaginatedResponse<PayrollRecord>>('/hr/payroll-records', {
    params: { limit: 500 },
  });
  return data.data;
};

/**
 * Version paginée/recherchable (page/limit/search).
 */
export const getPayrollRecordsPaginated = async (
  params: PaginationParams,
): Promise<PaginatedResponse<PayrollRecord>> => {
  const { data } = await api.get<PaginatedResponse<PayrollRecord>>('/hr/payroll-records', { params });
  return data;
};

/**
 * Traite la paie pour une période donnée.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param period - La période de paie (ex: "2024-07")
 */
export const processPayroll = async (period: string): Promise<PayrollRecord[]> => {
  const { data } = await api.post<PayrollRecord[]>('/hr/payroll/process', { period });
  return data;
};

/**
 * Signe un enregistrement de paie.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param payrollId - L'ID de l'enregistrement de paie
 * @param signature - La signature (URL ou données)
 */
export const signPayrollRecord = async (payrollId: string, signature: string): Promise<PayrollRecord> => {
  const { data } = await api.patch<PayrollRecord>(
    `/hr/payroll-records/${payrollId}/sign`,
    { signature }
  );
  return data;
};
