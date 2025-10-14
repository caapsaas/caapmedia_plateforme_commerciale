
import { api } from '../api';
import { Employee, DocumentType, LeaveType } from '../../types';

/**
 * Données pour la création d'un employé.
 * Les champs gérés par le backend sont omis.
 */
export type EmployeeCreationData = Omit<Employee, 'id' | 'subsidiaryId' | 'leaveBalance' | 'createdAt' | 'updatedAt' | 'documents' | 'positionHistory' | 'trainings' | 'performanceReviews' | 'leaveRecords'>;

/**
 * Données pour la mise à jour d'un employé.
 */
export type EmployeeUpdateData = Partial<EmployeeCreationData>;

/**
 * Récupère la liste de tous les employés.
 * @param includeRelations - Si true, inclut les relations (documents, manager, etc.).
 */
export const getEmployees = async (includeRelations = false): Promise<Employee[]> => {
    const { data } = await api.get<Employee[]>('/hr/employees', {
    params: { includeRelations },
  });
  return data;
};

/**
 * Récupère un employé spécifique par son ID.
 * @param id - L'ID de l'employé.
 * @param includeRelations - Si true, inclut les relations.
 */
export const getEmployeeById = async (id: string, includeRelations = false): Promise<Employee> => {
    const { data } = await api.get<Employee>(`/hr/employees/${id}`, {
    params: { includeRelations },
  });
  return data;
};

/**
 * Crée ou met à jour un employé.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 * @param employeeData - Les données de l'employé.
 */
export const saveEmployee = async (employeeData: Partial<Employee>): Promise<Employee> => {
    return employeeData.id
    ? (await api.patch<Employee>(`/hr/employees/${employeeData.id}`, employeeData)).data
    : (await api.post<Employee>('/hr/employees', employeeData)).data;
};

/**
 * Supprime un employé par son ID.
 * Protégé par rôle (ADMIN).
 * @returns L'employé qui a été supprimé.
 */
export const deleteEmployee = async (id: string): Promise<Employee> => {
    const { data } = await api.delete<Employee>(`/hr/employees/${id}`);
  return data;
};
// --- Fonctions pour les sous-entités ---

/**
 * Ajoute un document à un employé.
 */
export const addDocumentToEmployee = async (
    employeeId: string,
    document: { documentName: string; url: string; docType: DocumentType }
) => {
    const { data } = await api.post(`/hr/employees/${employeeId}/documents`, document);
    return data;
};

/**
 * Ajoute un enregistrement de congé pour un employé.
 */
export const addLeaveRecordToEmployee = async (
    employeeId: string,
    leave: { startDate: string; endDate: string; days?: number; leaveRecordType: LeaveType }
) => {
    const { data } = await api.post(`/hr/employees/${employeeId}/leaves`, leave);
    return data;
};

/**
 * Ajoute un historique de poste pour un employé.
 */
export const addPositionHistoryToEmployee = async (
  employeeId: string,
    position: { employeePosition: string; department?: string; startDate: string; endDate?: string }
) => {
    const { data } = await api.post(`/hr/employees/${employeeId}/position-history`, position);
    return data;
};
