import React, { useState, useEffect } from 'react';
import { Employee, Gender, ContractType, EmployeeStatus, PaymentMethod, EmployeeFormData } from '../../types';
import { useI18n } from '../../i18n';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: EmployeeFormData) => void;
    employee: Employee | null;
}

type FormTab = 'personal' | 'professional' | 'salary';

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSave, employee }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<FormTab>('personal');

    const initialFormState: EmployeeFormData = {
        lastName: '',
        firstName: '',
        birthDate: '',
        gender: Gender.MALE,
        address: '',
        phone: '',
        email: '',
        nationality: '',
        socialSecurityNumber: '',
        position: '',
        department: '',
        hireDate: new Date().toISOString().split('T')[0],
        contractType: ContractType.CDI,
        status: EmployeeStatus.ACTIVE,
        managerId: null,
        workLocation: '',
        baseSalary: 0,
        bonus: 0,
        benefits: [],
        lastSalaryAdjustmentDate: null,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
    };
    
    const [formData, setFormData] = useState<EmployeeFormData>(initialFormState);
    const [benefitsString, setBenefitsString] = useState('');

    useEffect(() => {
        if (employee) {
            const { id, subsidiaryId, documents, positionHistory, trainings, performanceReviews, leaveBalance, leaveRecords, ...editableData } = employee;
            setFormData(editableData);
            setBenefitsString(employee.benefits.join(', '));
        } else {
            setFormData(initialFormState);
            setBenefitsString('');
        }
        setActiveTab('personal');
    }, [employee, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['baseSalary', 'bonus'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleBenefitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBenefitsString(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalFormData = {
            ...formData,
            benefits: benefitsString.split(',').map(b => b.trim()).filter(b => b),
        };
        onSave(finalFormData);
    };
    
    if (!isOpen) return null;

    const TabButton: React.FC<{tab: FormTab, label: string}> = ({ tab, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab 
                ? 'border-b-2 border-[#c6e911] text-[#c6e911]' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">
                            {employee ? t('configuration.modal.editEmployeeTitle') : t('configuration.modal.addEmployeeTitle')}
                        </h3>
                    </div>
                    <div className="px-6 pt-4 border-b border-slate-200">
                        <nav className="flex space-x-1">
                            <TabButton tab="personal" label={t('configuration.form.formSection.personal')} />
                            <TabButton tab="professional" label={t('configuration.form.formSection.professional')} />
                            <TabButton tab="salary" label={t('configuration.form.formSection.salary')} />
                        </nav>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {activeTab === 'personal' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">{t('configuration.form.firstName')}</label>
                                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">{t('configuration.form.lastName')}</label>
                                        <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.birthDate')}</label>
                                        <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-slate-700">{t('configuration.form.gender')}</label>
                                        <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            {Object.values(Gender).map(g => <option key={g} value={g}>{t(`hr.gender.${g}`)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="nationality" className="block text-sm font-medium text-slate-700">{t('configuration.form.nationality')}</label>
                                        <input type="text" name="nationality" id="nationality" value={formData.nationality} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-slate-700">{t('configuration.form.ssn')}</label>
                                        <input type="text" name="socialSecurityNumber" id="socialSecurityNumber" value={formData.socialSecurityNumber} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'professional' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="position" className="block text-sm font-medium text-slate-700">{t('configuration.form.position')}</label>
                                        <input type="text" name="position" id="position" value={formData.position} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="department" className="block text-sm font-medium text-slate-700">{t('configuration.form.department')}</label>
                                        <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.hireDate')}</label>
                                        <input type="date" name="hireDate" id="hireDate" value={formData.hireDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="contractType" className="block text-sm font-medium text-slate-700">{t('configuration.form.contractType')}</label>
                                        <select name="contractType" id="contractType" value={formData.contractType} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            {Object.values(ContractType).map(ct => <option key={ct} value={ct}>{t(`hr.contractType.${ct}`)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('configuration.form.employeeStatus')}</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                        {Object.values(EmployeeStatus).map(es => <option key={es} value={es}>{t(`hr.employeeStatus.${es}`)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="workLocation" className="block text-sm font-medium text-slate-700">{t('configuration.form.workLocation')}</label>
                                    <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                            </div>
                        )}
                         {activeTab === 'salary' && (
                             <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-700">{t('configuration.form.baseSalary')}</label>
                                        <input type="number" name="baseSalary" id="baseSalary" value={formData.baseSalary} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="bonus" className="block text-sm font-medium text-slate-700">{t('configuration.form.bonus')}</label>
                                        <input type="number" name="bonus" id="bonus" value={formData.bonus} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="benefits" className="block text-sm font-medium text-slate-700">{t('configuration.form.benefits')}</label>
                                    <input type="text" name="benefits" id="benefits" value={benefitsString} onChange={handleBenefitsChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700">{t('configuration.form.paymentMethod')}</label>
                                        <select name="paymentMethod" id="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            {Object.values(PaymentMethod).map(pm => <option key={pm} value={pm}>{t(`hr.paymentMethod.${pm}`)}</option>)}
                                        </select>
                                    </div>
                                 </div>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors">{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeFormModal;