import React, { useState } from 'react';
import { Subsidiary, Employee, EmployeeFormData, ContractType, EmployeeStatus } from '../../types';
import { UseMutateFunction } from '@tanstack/react-query';
import { useI18n } from '../../i18n';
import { useToast } from '../../context/ToastContext';
import IconPlus from '../icons/IconPlus';
import IconEdit from '../icons/IconEdit';
import IconDelete from '../icons/IconDelete';
import IconEye from '../icons/IconEye';
import EmployeeFormModal from './EmployeeFormModal';
import ConfirmationModal from '../common/ConfirmationModal';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import { exportToCsv } from '../../utils/csvExporter';
import { exportToPdf } from '../../utils/pdfExporter';
import IconPrint from '../icons/IconPrint';
import IconExport from '../icons/IconExport';
import IconPdf from '../icons/IconPdf';

interface EmployeeDatabaseProps {
  subsidiary: Subsidiary;
  employees: Employee[];
  onSave: UseMutateFunction<Employee, Error, Partial<Employee>, unknown>;
  onDelete: UseMutateFunction<Employee, Error, string, unknown>;
}

const EmployeeDatabase: React.FC<EmployeeDatabaseProps> = ({ subsidiary, employees, onSave, onDelete }) => {
    const { t } = useI18n();
    const toast = useToast();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

    const handleOpenAddModal = () => {
        setEditingEmployee(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsFormModalOpen(true);
    };

    const handleOpenDeleteModal = (employee: Employee) => {
        setDeletingEmployee(employee);
    };
    
    const handleOpenViewModal = (employee: Employee) => {
        setViewingEmployee(employee);
    };

    const handleCloseModals = () => {
        setIsFormModalOpen(false);
        setDeletingEmployee(null);
        setEditingEmployee(null);
        setViewingEmployee(null);
    };

    const handleSaveEmployee = (employeeData: Partial<Employee>) => {
        try {
            // The onSave function is a react-query mutation that will handle the API call and data refetching.
            onSave(employeeData);
            const action = editingEmployee ? 'modifié' : 'ajouté';
            toast.success('Employé enregistré!', `L'employé a été ${action} avec succès.`);
            handleCloseModals();
        } catch (error) {
            toast.error('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde de l\'employé.');
        }
    };

    const handleDeleteEmployee = () => {
        try {
            if (deletingEmployee) {
                onDelete(deletingEmployee.id);
                toast.success('Employé supprimé!', 'L\'employé a été supprimé avec succès.');
                handleCloseModals();
            }
        } catch (error) {
            toast.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'employé.');
        }
    };

    const handlePrint = () => {
        window.print();
        toast.info('Impression lancée', 'La page est en cours d\'impression.');
    };

    const handleExport = () => {
        try {
            const headers = [
                { key: 'id', label: t('hr.employees.id') },
                { key: 'fullName', label: t('hr.employees.fullName') },
                { key: 'positions', label: t('hr.employees.position') },
                { key: 'department', label: t('hr.employees.department') },
                { key: 'contractType', label: t('hr.employees.contractType') },
                { key: 'status', label: t('hr.employees.status') },
                { key: 'email', label: t('configuration.form.email') },
                { key: 'phone', label: t('configuration.form.phone') },
                { key: 'hireDate', label: t('configuration.form.hireDate') },
            ];
            const data = employees.map(e => ({
                ...e,
                fullName: `${e.firstName} ${e.lastName}`,
                contractType: t(`hr.contractType.${e.contractType}`),
                status: t(`hr.employeeStatus.${e.status}`),
            }));
            exportToCsv('liste_employes', headers, data);
            toast.success('Export CSV réussi!', 'Les données ont été exportées au format CSV.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export CSV.');
        }
    };

    const handleExportPdf = () => {
        try {
            const headers = [
                { key: 'fullName', label: t('hr.employees.fullName') },
                { key: 'positions', label: t('hr.employees.position') },
                { key: 'department', label: t('hr.employees.department') },
                { key: 'email', label: t('configuration.form.email') },
                { key: 'phone', label: t('configuration.form.phone') },
            ];
            const data = employees.map(e => ({
                ...e,
                fullName: `${e.firstName} ${e.lastName}`,
            }));
            exportToPdf(t('hr.employees.title'), headers, data, 'employes');
            toast.success('Export PDF réussi!', 'Les données ont été exportées au format PDF.');
        } catch (error) {
            toast.error('Erreur d\'export', 'Une erreur est survenue lors de l\'export PDF.');
        }
    };
    
    const getContractTypeClass = (type: ContractType) => {
        switch(type) {
            case ContractType.CDI: return 'bg-blue-100 text-blue-800';
            case ContractType.CDD: return 'bg-purple-100 text-purple-800';
            case ContractType.INTERNSHIP: return 'bg-yellow-100 text-yellow-800';
            case ContractType.FREELANCE: return 'bg-gray-100 text-gray-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    const getStatusClass = (status: EmployeeStatus) => {
        switch(status) {
            case EmployeeStatus.ACTIVE: return 'bg-green-100 text-green-800';
            case EmployeeStatus.ON_LEAVE: return 'bg-yellow-100 text-yellow-800';
            case EmployeeStatus.RESIGNED: return 'bg-gray-100 text-gray-800';
            case EmployeeStatus.TERMINATED: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{t('hr.employees.title')}</h3>
                <div className="flex items-center space-x-2 no-print">
                    <button onClick={handleOpenAddModal} className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors">
                        <IconPlus className="h-4 w-4" />
                        <span>{t('hr.employees.add')}</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPrint className="h-4 w-4" />
                        <span>{t('common.print')}</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconExport className="h-4 w-4" />
                        <span>{t('common.export')}</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center space-x-2 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        <IconPdf className="h-4 w-4" />
                        <span>{t('common.exportPdf')}</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.id')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.fullName')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.position')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.department')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.contractType')}</th>
                            <th scope="col" className="px-6 py-3">{t('hr.employees.status')}</th>
                            <th scope="col" className="px-6 py-3 text-center no-print">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{employee.id}</td>
                                <td className="px-6 py-4 font-semibold">{`${employee.firstName} ${employee.lastName}`}</td>
                                <td className="px-6 py-4">{employee.positions}</td>
                                <td className="px-6 py-4">{employee.department}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getContractTypeClass(employee.contractType)}`}>
                                        {t(`hr.contractType.${employee.contractType}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(employee.status)}`}>
                                        {t(`hr.employeeStatus.${employee.status}`)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center space-x-1 no-print">
                                    <button onClick={() => handleOpenViewModal(employee)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors" aria-label={t('common.view')}>
                                        <IconEye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenEditModal(employee)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" aria-label={t('common.edit')}>
                                        <IconEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenDeleteModal(employee)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label={t('common.delete')}>
                                        <IconDelete className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <EmployeeFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseModals}
                    onSave={handleSaveEmployee}
                    employee={editingEmployee}
                />
            )}
            {deletingEmployee && (
                <ConfirmationModal
                    isOpen={!!deletingEmployee}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteEmployee}
                    title={t('configuration.modal.deleteEmployeeTitle')}
                    message={t('configuration.modal.deleteConfirmMessage', { itemName: `${deletingEmployee.firstName} ${deletingEmployee.lastName}` })}
                />
            )}
            {viewingEmployee && (
                <EmployeeDetailsModal
                    isOpen={!!viewingEmployee}
                    onClose={handleCloseModals}
                    employee={viewingEmployee}
                />
            )}
        </div>
    );
};

export default EmployeeDatabase;