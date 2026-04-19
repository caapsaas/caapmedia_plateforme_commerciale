import { TreasuryAccount, AccountType } from '../../types/models';
import { api } from '../api';

export interface CreateTreasuryAccountData {
  accountName: string;
  initialBalance: number;
  currency: string;
  accountType: AccountType;
}

export interface UpdateTreasuryAccountData {
  accountName?: string;
  accountType?: AccountType;
}

// Get all treasury accounts for a subsidiary
export const getTreasuryAccounts = async (subsidiaryId: string): Promise<TreasuryAccount[]> => {
  try {
    const response = await api.get(`/finance/treasury/accounts?subsidiaryId=${subsidiaryId}`);
    return response.data.map((account: any) => ({
      id: account.id,
      accountName: account.accountName,
      balance: parseFloat(account.balance.toString()),
      currency: account.currency,
      accountType: account.accountType,
      subsidiaryId: account.subsidiaryId,
    }));
  } catch (error) {
    console.error('Error fetching treasury accounts:', error);
    throw error;
  }
};

// Get a single treasury account by ID
export const getTreasuryAccount = async (id: string): Promise<TreasuryAccount> => {
  try {
    const response = await api.get(`/finance/treasury/accounts/${id}`);
    const account = response.data;
    return {
      id: account.id,
      accountName: account.accountName,
      balance: parseFloat(account.balance.toString()),
      currency: account.currency,
      accountType: account.accountType,
      subsidiaryId: account.subsidiaryId,
    };
  } catch (error) {
    console.error('Error fetching treasury account:', error);
    throw error;
  }
};

// Create a new treasury account
export const createTreasuryAccount = async (data: CreateTreasuryAccountData): Promise<TreasuryAccount> => {
  try {
    const response = await api.post('/finance/treasury/accounts', data);
    const account = response.data;
    return {
      id: account.id,
      accountName: account.accountName,
      balance: parseFloat(account.balance.toString()),
      currency: account.currency,
      accountType: account.accountType,
      subsidiaryId: account.subsidiaryId,
    };
  } catch (error) {
    console.error('Error creating treasury account:', error);
    throw error;
  }
};

// Update an existing treasury account
export const updateTreasuryAccount = async (id: string, data: UpdateTreasuryAccountData): Promise<TreasuryAccount> => {
  try {
    const response = await api.patch(`/finance/treasury/accounts/${id}`, data);
    const account = response.data;
    return {
      id: account.id,
      accountName: account.accountName,
      balance: parseFloat(account.balance.toString()),
      currency: account.currency,
      accountType: account.accountType,
      subsidiaryId: account.subsidiaryId,
    };
  } catch (error) {
    console.error('Error updating treasury account:', error);
    throw error;
  }
};

// Delete a treasury account
export const deleteTreasuryAccount = async (id: string): Promise<void> => {
  try {
    await api.delete(`/finance/treasury/accounts/${id}`);
  } catch (error) {
    console.error('Error deleting treasury account:', error);
    throw error;
  }
};
