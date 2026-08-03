import { api } from '../api';
import { PayrollRecord } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

// ============================================================
// TYPES - Configuration de paie
// ============================================================

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
  cfcEmployeeRate?: number;
  cfcEmployerRate?: number;
  fneRate?: number;
  cnpsCap?: number;
  professionalExpenseRate?: number;
  fixedAbatementAnnual?: number;
  riskGroupARate?: number;
  riskGroupBRate?: number;
  riskGroupCRate?: number;
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
  cfcEmployeeRate?: number;
  cfcEmployerRate?: number;
  fneRate?: number;
  cnpsCap?: number;
  professionalExpenseRate?: number;
  fixedAbatementAnnual?: number;
  riskGroupARate?: number;
  riskGroupBRate?: number;
  riskGroupCRate?: number;
}

// ============================================================
// TYPES - Paie (alignés avec le backend)
// ============================================================

export interface ProcessPayrollDto {
  period: string; // Format YYYY-MM
  subsidiaryId?: string; // Optionnel : par défaut utilise la filiale de l'utilisateur
  riskGroup?: 'A' | 'B' | 'C';
  applyCfc?: boolean;
  applyFne?: boolean;
}

export interface ProcessPayrollResponse {
  count: number;
  message: string;
}

export interface SimulatePayrollDto {
  employeeId: string;
  bonus?: number;
  allowances?: number;
  overtime?: number;
  riskGroup?: 'A' | 'B' | 'C';
}

export interface SimulatePayrollResponse {
  employee: {
    id: string;
    fullName: string;
    baseSalary: number;
  };
  simulation: {
    grossSalary: number;
    cnpsEmployee: number;
    cfcEmployee: number;
    irpp: number;
    cac: number;
    totalDeductions: number;
    netSalary: number;
    cnpsEmployerPension: number;
    cnpsFamilyBenefits: number;
    cnpsAccidentRisk: number;
    cfcEmployer: number;
    fne: number;
    totalEmployerCharges: number;
    totalEmployerCost: number;
    deductionsDetail: {
      label: string;
      amount: number;
      type: string;
    }[];
  };
}

export interface CreatePayrollRecordDto {
  employeeName: string;
  employeeId: string;
  payrollPeriod: string;
  baseSalary?: number;
  bonus?: number;
  allowances?: number;
  overtime?: number;
  otherEarnings?: number;
  grossSalary?: number;
  cnpsEmployee?: number;
  cfcEmployee?: number;
  irpp?: number;
  cac?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  netSalary?: number;
  cnpsEmployer?: number;
  cfcEmployer?: number;
  fne?: number;
  totalEmployerCost?: number;
  deductionsDetail?: {
    label: string;
    amount: number;
    type?: 'STATUTORY' | 'VOLUNTARY' | 'ADVANCE' | 'OTHER';
  }[];
  paymentDate?: string;
  signature?: string;
  status?: string;
  notes?: string;
}

export interface UpdatePayrollRecordDto extends Partial<CreatePayrollRecordDto> {}

// ============================================================
// CONFIGURATION DE PAIE
// ============================================================

/**
 * Récupère la configuration de paie d'une filiale
 */
export const getPayrollConfiguration = async (
  subsidiaryId: string,
): Promise<PayrollConfig> => {
  try {
    const { data } = await api.get<PayrollConfig>(
      `/configuration/payroll/${subsidiaryId}/full`,
    );
    return data;
  } catch (error: any) {
    // Fallback si l'endpoint /full n'existe pas
    if (error.response?.status === 404) {
      const { data } = await api.get<PayrollConfig>(
        `/configuration/payroll/${subsidiaryId}`,
      );
      return data;
    }
    throw error;
  }
};

/**
 * Alias pour compatibilité
 */
export const getFullPayrollConfiguration = async (
  subsidiaryId: string,
): Promise<PayrollConfig> => {
  return getPayrollConfiguration(subsidiaryId);
};

/**
 * Met à jour la configuration de paie d'une filiale
 */
export const updatePayrollConfiguration = async (
  subsidiaryId: string,
  config: UpdatePayrollConfigDto,
): Promise<PayrollConfig> => {
  const { data } = await api.put<PayrollConfig>(
    `/configuration/payroll/${subsidiaryId}`,
    config,
  );
  return data;
};

// ============================================================
// FICHES DE PAIE - CRUD
// ============================================================

/**
 * Récupère toutes les fiches de paie de la filiale de l'utilisateur connecté
 * GET /hr/payroll-records
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
 * Récupère toutes les fiches de paie de toutes les filiales (vue globale SUPER_ADMIN)
 * GET /hr/payroll-records/global
 */
export const getPayrollRecordsGlobal = async (): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PayrollRecord[]>('/hr/payroll-records/global');
  return data;
};

/**
 * Récupère une fiche de paie par ID
 * GET /hr/payroll-records/:id
 */
export const getPayrollRecordById = async (
  id: string,
): Promise<PayrollRecord> => {
  const { data } = await api.get<PayrollRecord>(`/hr/payroll-records/${id}`);
  return data;
};

/**
 * Récupère les fiches de paie d'une période
 * GET /hr/payroll-records/by-period?period=2026-07
 */
export const getPayrollRecordsByPeriod = async (
  period: string,
): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PayrollRecord[]>(
    '/hr/payroll-records/by-period',
    { params: { period } },
  );
  return data;
};

/**
 * Récupère l'historique de paie d'un employé
 * GET /hr/payroll-records/by-employee/:employeeId
 */
export const getPayrollRecordsByEmployee = async (
  employeeId: string,
): Promise<PayrollRecord[]> => {
  const { data } = await api.get<PayrollRecord[]>(
    `/hr/payroll-records/by-employee/${employeeId}`,
  );
  return data;
};

/**
 * Crée une fiche de paie manuellement
 * POST /hr/payroll-records
 */
export const createPayrollRecord = async (
  dto: CreatePayrollRecordDto,
): Promise<PayrollRecord> => {
  const { data } = await api.post<PayrollRecord>('/hr/payroll-records', dto);
  return data;
};

/**
 * Met à jour une fiche de paie
 * PATCH /hr/payroll-records/:id
 */
export const updatePayrollRecord = async (
  id: string,
  dto: UpdatePayrollRecordDto,
): Promise<PayrollRecord> => {
  const { data } = await api.patch<PayrollRecord>(
    `/hr/payroll-records/${id}`,
    dto,
  );
  return data;
};

/**
 * Supprime une fiche de paie
 * DELETE /hr/payroll-records/:id
 */
export const deletePayrollRecord = async (id: string): Promise<PayrollRecord> => {
  const { data } = await api.delete<PayrollRecord>(`/hr/payroll-records/${id}`);
  return data;
};

// ============================================================
// TRAITEMENT & ACTIONS
// ============================================================

/**
 * Génère automatiquement les fiches de paie pour une période
 * POST /hr/payroll-records/process
 *
 * @param dto - Objet contenant period, subsidiaryId (optionnel), et options de calcul
 */
export const processPayroll = async (
  dto: ProcessPayrollDto,
): Promise<ProcessPayrollResponse> => {
  const { data } = await api.post<ProcessPayrollResponse>(
    '/hr/payroll-records/process',
    {
      period: dto.period,
      subsidiaryId: dto.subsidiaryId,
      riskGroup: dto.riskGroup,
      applyCfc: dto.applyCfc,
      applyFne: dto.applyFne,
    },
  );
  return data;
};

/**
 * Simule le calcul de paie d'un employé (sans sauvegarder)
 * POST /hr/payroll-records/simulate
 */
export const simulatePayroll = async (
  dto: SimulatePayrollDto,
): Promise<SimulatePayrollResponse> => {
  const { data } = await api.post<SimulatePayrollResponse>(
    '/hr/payroll-records/simulate',
    dto,
  );
  return data;
};

/**
 * Signe une fiche de paie (passe en statut PAID)
 * PATCH /hr/payroll-records/:id/sign
 */
export const signPayrollRecord = async (
  payrollId: string,
  signature: string,
): Promise<PayrollRecord> => {
  const { data } = await api.patch<PayrollRecord>(
    `/hr/payroll-records/${payrollId}/sign`,
    { signature },
  );
  return data;
};