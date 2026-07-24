import React, { useState, useEffect } from 'react';
import { Employee, Gender, ContractType, EmployeeStatus, PaymentMethod, EmployeeFormData, LeaveRecord } from '../../types';
import { useI18n } from '../../i18n';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: EmployeeFormData) => void;
    employee: Employee | null;
}

type FormTab = 'personal' | 'professional' | 'salary' | 'documents' | 'leaves';

type EmployeeFormDataType = {
    lastName: string;
    firstName: string;
    birthDate: string;
    gender: Gender;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    socialSecurityNumber: string;
    positions: string;
    department: string;
    hireDate: string;
    contractType: ContractType;
    status: EmployeeStatus;
    managerId: string | null;
    workLocation: string;
    baseSalary: number;
    bonus: number;
    benefits: string[];
    lastSalaryAdjustmentDate: string | null;
    paymentMethod: PaymentMethod;
    documents: Array<{name: string, type: string, expiryDate: string, status: string, file: File | null}>;
    leaveBalance: {
        annual: number;
        sick: number;
        personal: number;
        maternity: number;
        paternity: number;
        other: number;
    };
    leaveRecords: LeaveRecord[];
};

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSave, employee }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<FormTab>('personal');

    const initialFormState = {
        lastName: '',
        firstName: '',
        birthDate: '',
        gender: Gender.MALE,
        address: '',
        phone: '',
        email: '',
        nationality: '',
        socialSecurityNumber: '',
        positions: '',
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
        documents: [] as Array<{name: string, type: string, expiryDate: string, status: string, file: File | null}>,
        leaveBalance: {
            annual: 0,
            sick: 0,
            personal: 0,
            maternity: 0,
            paternity: 0,
            other: 0
        },
        leaveRecords: []
    };
    
    const [formData, setFormData] = useState<EmployeeFormDataType>(initialFormState);
    const [benefitsString, setBenefitsString] = useState('');
    const [documentsList, setDocumentsList] = useState<Array<{name: string, type: string, expiryDate: string, status: string, file: File | null}>>([]);

    useEffect(() => {
        try {
            if (employee) {
                // Destructure pour isoler les champs qui nécessitent une transformation
                const { id, subsidiaryId, documents, positionHistory, trainings, performanceReviews, leaveBalance, leaveRecords, positions, birthDate, hireDate, ...restOfEmployee } = employee;
                
                // Prépare les données pour le formulaire en s'assurant que les types correspondent
                const formattedData: EmployeeFormDataType = {
                    ...initialFormState, // Assure que tous les champs sont initialisés
                    ...restOfEmployee,
                    positions: positions || '', // Map `positions` (modèle) vers `position` (formulaire) avec fallback
                    // Formate les dates en chaîne 'YYYY-MM-DD' pour les inputs de type 'date' avec gestion d'erreur
                    birthDate: birthDate ? (() => { try { return new Date(birthDate).toISOString().split('T')[0]; } catch { return ''; } })() : '',
                    hireDate: hireDate ? (() => { try { return new Date(hireDate).toISOString().split('T')[0]; } catch { return ''; } })() : '',
                    lastSalaryAdjustmentDate: employee.lastSalaryAdjustmentDate ? (() => { try { return new Date(employee.lastSalaryAdjustmentDate).toISOString().split('T')[0]; } catch { return null; } })() : null,
                    // Transform documents object to flat array structure avec gestion d'erreur
                    documents: [
                        ...(documents?.contract ? [{...documents.contract, type: 'CONTRACT', expiryDate: '', status: 'VALID', file: null}] : []),
                        ...(documents?.idCard ? [{...documents.idCard, type: 'ID_CARD', expiryDate: '', status: 'VALID', file: null}] : []),
                        ...(documents?.workPermit ? [{...documents.workPermit, type: 'PASSPORT', expiryDate: '', status: 'VALID', file: null}] : []),
                        ...(documents?.diplomas?.map(diploma => ({...diploma, type: 'DIPLOMA', expiryDate: '', status: 'VALID', file: null})) || [])
                    ],
                    leaveBalance: leaveBalance || {
                        annual: 0,
                        sick: 0,
                        personal: 0,
                        maternity: 0,
                        paternity: 0,
                        other: 0
                    },
                    leaveRecords: leaveRecords || []
                };

                setFormData(formattedData);
                setBenefitsString(employee.benefits?.join(', ') || '');
                setDocumentsList(formattedData.documents);
            } else {
                setFormData(initialFormState);
                setBenefitsString('');
                setDocumentsList([]);
            }
            setActiveTab('personal');
        } catch (error) {
            console.error('Error in EmployeeFormModal useEffect:', error);
            // En cas d'erreur, réinitialiser le formulaire à l'état par défaut
            setFormData(initialFormState);
            setBenefitsString('');
            setDocumentsList([]);
            setActiveTab('personal');
        }
    }, [employee, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['baseSalary', 'bonus'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleBenefitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBenefitsString(e.target.value);
    };

    const handleDocumentChange = (index: number, field: string, value: string | File | null) => {
        const updatedDocuments = [...documentsList];
        updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
        setDocumentsList(updatedDocuments);
    };

    const handleDocumentFileChange = (index: number, file: File | null) => {
        const updatedDocuments = [...documentsList];
        updatedDocuments[index] = { ...updatedDocuments[index], file };
        // Auto-fill name from filename if name is empty
        if (file && !updatedDocuments[index].name) {
            updatedDocuments[index].name = file.name.split('.')[0];
        }
        setDocumentsList(updatedDocuments);
    };

    const addDocument = () => {
        setDocumentsList([...documentsList, { name: '', type: '', expiryDate: '', status: 'VALID', file: null }]);
    };

    const removeDocument = (index: number) => {
        setDocumentsList(documentsList.filter((_, i) => i !== index));
    };

    const handleLeaveBalanceChange = (leaveType: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            leaveBalance: {
                ...prev.leaveBalance,
                [leaveType]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Transform documentsList to the correct structure
        const transformedDocuments = {
            contract: documentsList.find(doc => doc.type === 'CONTRACT') ? {
                name: documentsList.find(doc => doc.type === 'CONTRACT')!.name,
                url: '', // URL will be set by backend,
                file: documentsList.find(doc => doc.type === 'CONTRACT')!.file
            } : null,
            idCard: documentsList.find(doc => doc.type === 'ID_CARD') ? {
                name: documentsList.find(doc => doc.type === 'ID_CARD')!.name,
                url: '', // URL will be set by backend,
                file: documentsList.find(doc => doc.type === 'ID_CARD')!.file
            } : null,
            workPermit: documentsList.find(doc => doc.type === 'PASSPORT') ? {
                name: documentsList.find(doc => doc.type === 'PASSPORT')!.name,
                url: '', // URL will be set by backend,
                file: documentsList.find(doc => doc.type === 'PASSPORT')!.file
            } : null,
            diplomas: documentsList.filter(doc => doc.type === 'DIPLOMA').map(doc => ({
                name: doc.name,
                url: '', // URL will be set by backend,
                file: doc.file
            }))
        };

        const finalFormData: EmployeeFormData = {
            ...formData,
            benefits: benefitsString.split(',').map(b => b.trim()).filter(b => b),
            documents: transformedDocuments,
            // Ajouter l'ID si c'est une modification
            ...(employee && { id: employee.id }),
        };
        onSave(finalFormData);
    };
    
    if (!isOpen) return null;

    try {
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
                <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-x-auto" onClick={e => e.stopPropagation()}>
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
                                <TabButton tab="documents" label={t('configuration.form.formSection.documents')} />
                                <TabButton tab="leaves" label={t('configuration.form.formSection.leaves')} />
                            </nav>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {activeTab === 'personal' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">{t('configuration.form.firstName')}</label>
                                            <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">{t('configuration.form.lastName')}</label>
                                            <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.birthDate')}</label>
                                            <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="gender" className="block text-sm font-medium text-slate-700">{t('configuration.form.gender')}</label>
                                            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                                {Object.values(Gender).map(g => <option key={g} value={g}>{t(`hr.gender.${g}`)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">{t('configuration.form.address')}</label>
                                        <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('configuration.form.phone')}</label>
                                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('configuration.form.email')}</label>
                                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nationality" className="block text-sm font-medium text-slate-700">{t('configuration.form.nationality')}</label>
                                            <input type="text" name="nationality" id="nationality" value={formData.nationality} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="socialSecurityNumber" className="block text-sm font-medium text-slate-700">{t('configuration.form.ssn')}</label>
                                            <input type="text" name="socialSecurityNumber" id="socialSecurityNumber" value={formData.socialSecurityNumber} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'professional' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="positions" className="block text-sm font-medium text-slate-700">{t('configuration.form.position')}</label>
                                            <input type="text" name="positions" id="positions" value={formData.positions} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="department" className="block text-sm font-medium text-slate-700">{t('configuration.form.department')}</label>
                                            <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="hireDate" className="block text-sm font-medium text-slate-700">{t('configuration.form.hireDate')}</label>
                                            <input type="date" name="hireDate" id="hireDate" value={formData.hireDate} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="contractType" className="block text-sm font-medium text-slate-700">{t('configuration.form.contractType')}</label>
                                            <select name="contractType" id="contractType" value={formData.contractType} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                                {Object.values(ContractType).map(ct => <option key={ct} value={ct}>{t(`hr.contractType.${ct}`)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-slate-700">{t('configuration.form.employeeStatus')}</label>
                                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                            {Object.values(EmployeeStatus).map(es => <option key={es} value={es}>{t(`hr.employeeStatus.${es}`)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="workLocation" className="block text-sm font-medium text-slate-700">{t('configuration.form.workLocation')}</label>
                                        <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                </div>
                            )}
                            {activeTab === 'salary' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-700">{t('configuration.form.baseSalary')}</label>
                                            <input type="number" name="baseSalary" id="baseSalary" value={formData.baseSalary} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="bonus" className="block text-sm font-medium text-slate-700">{t('configuration.form.bonus')}</label>
                                            <input type="number" name="bonus" id="bonus" value={formData.bonus} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="benefits" className="block text-sm font-medium text-slate-700">{t('configuration.form.benefits')}</label>
                                        <input type="text" name="benefits" id="benefits" value={benefitsString} onChange={handleBenefitsChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700">{t('configuration.form.paymentMethod')}</label>
                                            <select name="paymentMethod" id="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm">
                                                {Object.values(PaymentMethod).map(pm => <option key={pm} value={pm}>{t(`hr.paymentMethod.${pm}`)}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-md font-medium text-slate-800">{t('hr.documents.title')}</h4>
                                        <button
                                            type="button"
                                            onClick={addDocument}
                                            className="px-3 py-1 bg-[#c6e911] text-slate-800 text-sm rounded-md hover:bg-[#adc40f] transition-colors"
                                        >
                                            {t('hr.documents.addDocument')}
                                        </button>
                                    </div>
                                    {documentsList.map((doc, index) => (
                                        <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-sm font-medium text-slate-700">{t('hr.documents.document')} {index + 1}</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument(index)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('hr.documents.name')}</label>
                                                    <input
                                                        type="text"
                                                        value={doc.name}
                                                        onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('hr.documents.type')}</label>
                                                    <select
                                                        value={doc.type}
                                                        onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                                    >
                                                        <option value="">{t('hr.documents.selectType')}</option>
                                                        <option value="ID_CARD">{t('hr.documentType.idCard')}</option>
                                                        <option value="PASSPORT">{t('hr.documentType.passport')}</option>
                                                        <option value="CONTRACT">{t('hr.documentType.contract')}</option>
                                                        <option value="CV">{t('hr.documentType.cv')}</option>
                                                        <option value="DIPLOMA">{t('hr.documentType.diploma')}</option>
                                                        <option value="OTHER">{t('hr.documentType.other')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('hr.documents.expiryDate')}</label>
                                                    <input
                                                        type="date"
                                                        value={doc.expiryDate}
                                                        onChange={(e) => handleDocumentChange(index, 'expiryDate', e.target.value)}
                                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700">{t('hr.documents.status')}</label>
                                                    <select
                                                        value={doc.status}
                                                        onChange={(e) => handleDocumentChange(index, 'status', e.target.value)}
                                                        className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                                    >
                                                        <option value="VALID">{t('hr.documentStatus.valid')}</option>
                                                        <option value="EXPIRED">{t('hr.documentStatus.expired')}</option>
                                                        <option value="PENDING">{t('hr.documentStatus.pending')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <label className="block text-sm font-medium text-slate-700">{t('hr.documents.file')}</label>
                                                <input
                                                    type="file"
                                                    onChange={(e) => handleDocumentFileChange(index, e.target.files?.[0] || null)}
                                                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#c6e911] file:text-slate-800 hover:file:bg-[#adc40f]"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                />
                                                {doc.file && (
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        {t('hr.documents.fileSelected')}: {doc.file.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {documentsList.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>{t('hr.documents.noDocuments')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'leaves' && (
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-slate-800">{t('hr.leaveBalance.title')}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="annualLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.annual')}</label>
                                            <input
                                                type="number"
                                                id="annualLeave"
                                                value={formData.leaveBalance?.annual || 0}
                                                onChange={(e) => handleLeaveBalanceChange('annual', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="sickLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.sick')}</label>
                                            <input
                                                type="number"
                                                id="sickLeave"
                                                value={formData.leaveBalance?.sick || 0}
                                                onChange={(e) => handleLeaveBalanceChange('sick', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="personalLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.personal')}</label>
                                            <input
                                                type="number"
                                                id="personalLeave"
                                                value={formData.leaveBalance?.personal || 0}
                                                onChange={(e) => handleLeaveBalanceChange('personal', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="maternityLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.maternity')}</label>
                                            <input
                                                type="number"
                                                id="maternityLeave"
                                                value={formData.leaveBalance?.maternity || 0}
                                                onChange={(e) => handleLeaveBalanceChange('maternity', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="paternityLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.paternity')}</label>
                                            <input
                                                type="number"
                                                id="paternityLeave"
                                                value={formData.leaveBalance?.paternity || 0}
                                                onChange={(e) => handleLeaveBalanceChange('paternity', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="otherLeave" className="block text-sm font-medium text-slate-700">{t('hr.leaveType.other')}</label>
                                            <input
                                                type="number"
                                                id="otherLeave"
                                                value={formData.leaveBalance?.other || 0}
                                                onChange={(e) => handleLeaveBalanceChange('other', parseFloat(e.target.value) || 0)}
                                                className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:outline-none focus:ring-1 focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                                        <h5 className="text-sm font-medium text-slate-700 mb-2">{t('hr.leaveBalance.summary')}</h5>
                                        <div className="text-sm text-slate-600">
                                            <p>{t('hr.leaveBalance.totalDays')}: <span className="font-semibold">{Object.values(formData.leaveBalance || {}).reduce((sum, days) => sum + days, 0)} {t('hr.leaveBalance.days')}</span></p>
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
    } catch (renderError) {
        console.error('Error rendering EmployeeFormModal:', renderError);
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
                    <h3 className="text-lg font-bold text-red-600 mb-2">Erreur de chargement</h3>
                    <p className="text-slate-600 mb-4">Une erreur est survenue lors du chargement du formulaire. Veuillez réessayer.</p>
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        );
    }
};

export default EmployeeFormModal;
