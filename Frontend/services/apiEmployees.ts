import { api } from '../services/api';
import { Employee, EmployeeStatus, Gender, ContractType } from '../../Frontend/types';

/**
 * DTO pour la création ou la mise à jour d'un employé.
 * Les champs sont basés sur le formulaire de configuration.
 */
export interface SaveEmployeeDto {
  id?: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  nationality: string;
  ssn: string;
  phone: string;
  email: string;
  address: string;
  position: string;
  department: string;
  hireDate: string;
  contractType: ContractType;
  employeeStatus: EmployeeStatus;
  workLocation: string;
  baseSalary: number;
  bonus?: number;
  benefits?: string[];
}

/**
 * Récupère la liste de tous les employés.
 */
export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<Employee[]>('/hr/employees');
  return data;
};

/**
 * Crée ou met à jour un employé.
 * @param employeeData - Les données de l'employé.
 */
export const saveEmployee = async (employeeData: SaveEmployeeDto): Promise<Employee> => {
  return employeeData.id
    ? (await api.patch<Employee>(`/hr/employees/${employeeData.id}`, employeeData)).data
    : (await api.post<Employee>('/hr/employees', employeeData)).data;
};

/**
 * Supprime un employé par son ID.
 */
export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/hr/employees/${id}`);
};
