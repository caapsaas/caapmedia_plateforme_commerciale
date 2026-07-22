
import { api } from '../api';
import { Employee, DocumentType, LeaveType, EmployeeFormData } from '../../types';

/**
 * Données pour la création d'un employé.
 * Les champs gérés par le backend sont omis.
 * Inclut désormais documents et leaveRecords/leaveBalance pour une sauvegarde complète.
 */
export type EmployeeCreationData = Omit<Employee, 'id' | 'subsidiaryId' | 'createdAt' | 'updatedAt' | 'positionHistory' | 'trainings' | 'performanceReviews'>;

/**
 * Données pour la mise à jour d'un employé.
 */
export type EmployeeUpdateData = Partial<EmployeeCreationData>;

/**
 * Données pour sauvegarder un employé (création ou mise à jour).
 */
export type EmployeeSaveData = EmployeeFormData & { id?: string };

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
 * @param includeRelations - Si true, inclut les relations (documents, congés, etc.).
 */
export const getEmployeeById = async (id: string, includeRelations = false): Promise<Employee> => {
    const { data } = await api.get<Employee>(`/hr/employees/${id}`, {
    params: { includeRelations },
  });
  return data;
};

/**
 * Récupère un employé avec TOUTES ses relations (documents, congés, etc.).
 * Utile après une modification pour avoir les données complètes.
 */
export const getEmployeeWithRelations = async (id: string): Promise<Employee> => {
  return getEmployeeById(id, true);
};

/**
 * Crée ou met à jour un employé.
 * Protégé par rôle (HR_MANAGER, ADMIN).
 *
 * Nettoit les données avant envoi:
 * - Supprime les objets File (utilisés localement)
 * - Formate correctement les dates
 * - Inclut les soldes et historique de congés
 * - Ignore les champs non-sérialisables
 *
 * @param employeeData - Les données de l'employé (création ou mise à jour).
 * @returns L'employé créé ou mis à jour
 */
export const saveEmployee = async (employeeData: EmployeeSaveData): Promise<Employee> => {
    const formatDateToString = (date: string | Date | undefined): string | undefined => {
        if (!date) return undefined;
        if (typeof date === 'string') return date;
        return new Date(date).toISOString().split('T')[0];
    };

    // Nettoyer et préparer les données pour l'envoi
    const payload: any = {
        // Informations personnelles
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        birthDate: formatDateToString(employeeData.birthDate),
        gender: employeeData.gender,
        address: employeeData.address,
        phone: employeeData.phone,
        email: employeeData.email,
        nationality: employeeData.nationality,
        socialSecurityNumber: employeeData.socialSecurityNumber,

        // Informations professionnelles
        positions: employeeData.positions,
        department: employeeData.department,
        hireDate: formatDateToString(employeeData.hireDate),
        contractType: employeeData.contractType,
        status: employeeData.status,
        managerId: employeeData.managerId,
        workLocation: employeeData.workLocation,

        // Informations de paie
        baseSalary: employeeData.baseSalary,
        bonus: employeeData.bonus,
        benefits: employeeData.benefits,
        lastSalaryAdjustmentDate: formatDateToString(employeeData.lastSalaryAdjustmentDate),
        paymentMethod: employeeData.paymentMethod,
        bankName: employeeData.bankName,
        bankAccountNumber: employeeData.bankAccountNumber,

        // Informations spécifiques Cameroun
        cnpsNumber: employeeData.cnpsNumber,
        categoryCodeCNPS: employeeData.categoryCodeCNPS,
        numberDependents: employeeData.numberDependents,
        situationMatrimony: employeeData.situationMatrimony,
        taxIdNTif: employeeData.taxIdNTif,

        // Congés - SEULEMENT les URLs et données valides
        leaveBalance: employeeData.leaveBalance ? {
            annual: employeeData.leaveBalance.annual ?? 0,
            sick: employeeData.leaveBalance.sick ?? 0,
            personal: employeeData.leaveBalance.personal ?? 0,
            maternity: employeeData.leaveBalance.maternity ?? 0,
            paternity: employeeData.leaveBalance.paternity ?? 0,
            other: employeeData.leaveBalance.other ?? 0,
            unpaid: employeeData.leaveBalance.unpaid ?? 0,
        } : undefined,

        // Historique des congés - uniquement les champs valides
        leaveRecords: employeeData.leaveRecords
            ? employeeData.leaveRecords.map((record) => ({
                leaveRecordType: record.leaveRecordType,
                startDate: formatDateToString(record.startDate),
                endDate: formatDateToString(record.endDate),
                days: record.days,
            }))
            : [],

        // Documents - NE PAS envoyer les objets File (upload séparé)
        // Nettoyer les documents pour ne garder que les URLs valides
        documents: employeeData.documents ? {
            contract: employeeData.documents.contract && !(employeeData.documents.contract as any).file
                ? employeeData.documents.contract
                : null,
            idCard: employeeData.documents.idCard && !(employeeData.documents.idCard as any).file
                ? employeeData.documents.idCard
                : null,
            workPermit: employeeData.documents.workPermit && !(employeeData.documents.workPermit as any).file
                ? employeeData.documents.workPermit
                : null,
            diplomas: employeeData.documents.diplomas
                ? employeeData.documents.diplomas.filter((d) => !(d as any).file)
                : [],
        } : undefined,
    };

    return employeeData.id
        ? (await api.patch<Employee>(`/hr/employees/${employeeData.id}`, payload)).data
        : (await api.post<Employee>('/hr/employees', payload)).data;
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
 * Upload un document pour un employé.
 * Utilise FormData pour multipart/form-data upload.
 * Retourne l'URL du fichier uploadé.
 */
export const uploadDocumentFile = async (
    employeeId: string,
    file: File,
    documentType: 'contract' | 'idCard' | 'workPermit' | 'diploma'
): Promise<{ url: string; name: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const { data } = await api.post<{ url: string; name: string }>(
        `/hr/employees/${employeeId}/documents/upload`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return data;
};

/**
 * Ajoute un document à un employé (legacy - pour compatibilité).
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
    leave: { startDate: string; endDate: string; days: number; leaveRecordType: LeaveType }
) => {
    const { data } = await api.post(`/hr/employees/${employeeId}/leaves`, leave);
    return data;
};

/**
 * Sauvegarde complètement un employé avec tous ses documents et congés.
 * Upload les fichiers d'abord, puis les attache à l'employé.
 */
export const saveEmployeeWithDocumentsAndLeaves = async (employeeData: EmployeeSaveData): Promise<Employee> => {
    // 1. D'abord, sauvegarder l'employé sans documents/congés
    const savedEmployee = await saveEmployee(employeeData);

    try {
        // 2. Ajouter les documents (upload les fichiers d'abord si nécessaire)
        if (employeeData.documents) {
            const docTypeMap: Record<string, 'contract' | 'idCard' | 'workPermit' | 'diploma'> = {
                contract: 'contract',
                idCard: 'idCard',
                workPermit: 'workPermit',
            };

            const docFields = ['contract', 'idCard', 'workPermit'] as const;
            for (const field of docFields) {
                const doc = employeeData.documents[field];
                if (doc) {
                    let docUrl = doc.url;

                    // Si c'est un nouveau fichier (blob URL), uploader le fichier
                    if (doc.url && doc.url.startsWith('blob:') && (doc as any).file) {
                        try {
                            const uploadResult = await uploadDocumentFile(
                                savedEmployee.id,
                                (doc as any).file,
                                docTypeMap[field]
                            );
                            docUrl = uploadResult.url;
                        } catch (uploadError) {
                            console.error(`Error uploading ${field}:`, uploadError);
                            continue;
                        }
                    }

                    // Ajouter le document avec l'URL (locale ou uploadée)
                    if (docUrl) {
                        await addDocumentToEmployee(savedEmployee.id, {
                            documentName: doc.name,
                            url: docUrl,
                            docType: field === 'contract' ? 'CONTRACT' : field === 'idCard' ? 'ID_CARD' : 'WORK_PERMIT' as any,
                        });
                    }
                }
            }

            // Ajouter les diplômes
            if (employeeData.documents.diplomas && Array.isArray(employeeData.documents.diplomas)) {
                for (const diploma of employeeData.documents.diplomas) {
                    if (diploma) {
                        let diplomaUrl = diploma.url;

                        // Si c'est un nouveau fichier, uploader le fichier
                        if (diploma.url && diploma.url.startsWith('blob:') && (diploma as any).file) {
                            try {
                                const uploadResult = await uploadDocumentFile(
                                    savedEmployee.id,
                                    (diploma as any).file,
                                    'diploma'
                                );
                                diplomaUrl = uploadResult.url;
                            } catch (uploadError) {
                                console.error('Error uploading diploma:', uploadError);
                                continue;
                            }
                        }

                        // Ajouter le diplôme avec l'URL
                        if (diplomaUrl) {
                            await addDocumentToEmployee(savedEmployee.id, {
                                documentName: diploma.name,
                                url: diplomaUrl,
                                docType: 'DIPLOMA' as any,
                            });
                        }
                    }
                }
            }
        }

        // 3. Ajouter les enregistrements de congés
        if (employeeData.leaveRecords && Array.isArray(employeeData.leaveRecords)) {
            for (const record of employeeData.leaveRecords) {
                await addLeaveRecordToEmployee(savedEmployee.id, {
                    startDate: typeof record.startDate === 'string'
                        ? record.startDate
                        : new Date(record.startDate).toISOString().split('T')[0],
                    endDate: typeof record.endDate === 'string'
                        ? record.endDate
                        : new Date(record.endDate).toISOString().split('T')[0],
                    days: record.days,
                    leaveRecordType: record.leaveRecordType,
                });
            }
        }

        return savedEmployee;
    } catch (error) {
        console.error('Error adding documents/leaves:', error);
        // Retourner quand même l'employé sauvegardé, même si docs/leaves échouent
        return savedEmployee;
    }
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
