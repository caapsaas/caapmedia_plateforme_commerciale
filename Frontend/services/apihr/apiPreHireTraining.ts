import { api } from '../api';

export type PreHireTrainingStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'HIRED' | 'NOT_RETAINED' | 'CANCELLED';

export type PreHireEmployeeInput = {
  firstName: string; lastName: string; birthDate: string; address: string; phone: string; email: string;
  nationality: string; socialSecurityNumber: string; positions: string; department: string;
  hireDate: string; workLocation: string; baseSalary: number; bonus: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER'; contractType: 'CDI' | 'CDD' | 'FREELANCE' | 'INTERNSHIP';
  status: 'ACTIVE'; paymentMethod: 'BANK_TRANSFER' | 'CHECK' | 'CASH'; bankAccountNumber?: string;
  bankName?: string;
};

export interface PreHireTraining {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  targetPosition: string;
  department?: string | null;
  mentorName?: string | null;
  startDate: string;
  plannedEndDate?: string | null;
  status: PreHireTrainingStatus;
  progress: number;
  acquiredClients: number;
  acquiredProspects: number;
  evaluation?: string | null;
  outcome?: string | null;
  notes?: string | null;
  subsidiaryId: string;
  subsidiary?: { id: string; subsidiaryName: string };
  employeeId?: string | null;
}

export type PreHireTrainingInput = Omit<PreHireTraining, 'id' | 'subsidiary' | 'subsidiaryId'> & { subsidiaryId?: string };

export const getPreHireTrainings = async (subsidiaryId?: string): Promise<PreHireTraining[]> =>
  (await api.get<PreHireTraining[]>('/hr/pre-hire-training', { params: subsidiaryId ? { subsidiaryId } : undefined })).data;

export const savePreHireTraining = async (record: Partial<PreHireTrainingInput> & Pick<PreHireTrainingInput, 'firstName' | 'lastName' | 'phone' | 'targetPosition' | 'startDate'>, id?: string) =>
  id
    ? (await api.patch<PreHireTraining>(`/hr/pre-hire-training/${id}`, record)).data
    : (await api.post<PreHireTraining>('/hr/pre-hire-training', record)).data;

export const deletePreHireTraining = async (id: string) => api.delete(`/hr/pre-hire-training/${id}`);

export const convertPreHireTraining = async (id: string, input: PreHireEmployeeInput) =>
  (await api.post(`/hr/pre-hire-training/${id}/convert`, input)).data;
