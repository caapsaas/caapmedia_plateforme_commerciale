import { api } from "../api";
export type NeedStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface NeedRequest {
  payment: NeedRequestPayment | null;
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  desiredDate: string | null;
  status: NeedStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  requester: { id: string; userName: string };
  reviewer: { id: string; userName: string } | null;
  subsidiary: { id: string; subsidiaryName: string };
}
export interface CreateNeedRequest {
  title: string;
  description: string;
  estimatedBudget?: number;
  desiredDate?: string;
}
export const getNeedRequests = async (): Promise<NeedRequest[]> =>
  (await api.get("/purchasing/need-requests")).data;
export const createNeedRequest = async (
  data: CreateNeedRequest,
): Promise<NeedRequest> =>
  (await api.post("/purchasing/need-requests", data)).data;
export const reviewNeedRequest = async (
  id: string,
  status: Exclude<NeedStatus, "PENDING">,
  rejectionReason?: string,
): Promise<NeedRequest> =>
  (
    await api.patch(`/purchasing/need-requests/${id}/review`, {
      status,
      rejectionReason,
    })
  ).data;

export interface NeedRequestPayment {
  id: string;
  amount: string;
  currency: string;
  beneficiary: string;
  category: NeedExpenseCategory;
  reference: string | null;
  paidAt: string;
  paidBy: { id: string; userName: string };
  financialTransaction: {
    treasuryAccount: { id: string; accountName: string };
  };
}
export type NeedExpenseCategory =
  | "RENT"
  | "SALARIES"
  | "ADVERTISING"
  | "TRANSPORT"
  | "SERVICES"
  | "INSURANCE"
  | "PURCHASE_COST"
  | "COMMISSIONS"
  | "PACKAGING"
  | "TRANSACTION_FEES"
  | "OTHER";
export interface NeedPaymentAccount {
  id: string;
  accountName: string;
  balance: string;
  currency: string;
}
export interface PayNeedRequest {
  amount: number;
  transactionDate: string;
  beneficiary: string;
  category: NeedExpenseCategory;
  reference?: string;
}
export const getNeedPaymentAccount = async (
  id: string,
): Promise<NeedPaymentAccount> =>
  (await api.get(`/purchasing/need-requests/${id}/payment-account`)).data;
export const payNeedRequest = async (
  id: string,
  data: PayNeedRequest,
): Promise<NeedRequest> =>
  (await api.post(`/purchasing/need-requests/${id}/pay`, data)).data;
