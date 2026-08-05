import { api } from '../api';

export interface PayrollTaxSummary {
  period: string;
  employeeCount: number;
  grossSalary: number;
  netSalary: number;
  cnpsEmployee: number;
  cnpsEmployer: number;
  cnpsTotal: number;
  cfcEmployee: number;
  cfcEmployer: number;
  cfcTotal: number;
  irpp: number;
  cac: number;
  irppTotal: number;
  fne: number;
  totalEmployerCost: number;
}

export interface VatSummary {
  period: string;
  orderCount: number;
  taxableSubtotal: number;
  vatCollected: number;
  totalWithTax: number;
}

export interface IrppDetailLine {
  employeeName: string;
  matricule: string;
  baseAmount: number;
  irppAmount: number;
}

export interface IrppDetail {
  period: string;
  details: IrppDetailLine[];
  totalAmount: number;
}

export interface CnpsDetailLine {
  employeeName: string;
  matricule: string;
  baseAmount: number;
  employeeShare: number;
  employerShare: number;
  total: number;
}

export interface CnpsDetail {
  period: string;
  details: CnpsDetailLine[];
  totalEmployee: number;
  totalEmployer: number;
  total: number;
}

export interface CfcFneDetailLine {
  employeeName: string;
  matricule: string;
  baseAmount: number;
  amount: number;
}

export interface CfcFneDetail {
  period: string;
  cfc: { details: CfcFneDetailLine[]; totalAmount: number };
  fne: { details: CfcFneDetailLine[]; totalAmount: number };
}

export interface VatDetailLine {
  orderId: string;
  date: string;
  clientName: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface VatDetail {
  period: string;
  details: VatDetailLine[];
}

export interface TaxTransparencyPeriodParams {
  month: number;
  year: number;
  subsidiaryId?: string;
}

export const getPayrollTaxSummary = async (
  params: TaxTransparencyPeriodParams,
): Promise<PayrollTaxSummary> => {
  const { data } = await api.get<PayrollTaxSummary>('/finance/tax-transparency/payroll-summary', { params });
  return data;
};

export const getVatSummary = async (
  params: TaxTransparencyPeriodParams,
): Promise<VatSummary> => {
  const { data } = await api.get<VatSummary>('/finance/tax-transparency/vat-summary', { params });
  return data;
};

export const getIrppDetail = async (
  params: TaxTransparencyPeriodParams,
): Promise<IrppDetail> => {
  const { data } = await api.get<IrppDetail>('/finance/tax-transparency/irpp-detail', { params });
  return data;
};

export const getCnpsDetail = async (
  params: TaxTransparencyPeriodParams,
): Promise<CnpsDetail> => {
  const { data } = await api.get<CnpsDetail>('/finance/tax-transparency/cnps-detail', { params });
  return data;
};

export const getCfcFneDetail = async (
  params: TaxTransparencyPeriodParams,
): Promise<CfcFneDetail> => {
  const { data } = await api.get<CfcFneDetail>('/finance/tax-transparency/cfc-fne-detail', { params });
  return data;
};

export const getVatDetail = async (
  params: TaxTransparencyPeriodParams,
): Promise<VatDetail> => {
  const { data } = await api.get<VatDetail>('/finance/tax-transparency/vat-detail', { params });
  return data;
};
