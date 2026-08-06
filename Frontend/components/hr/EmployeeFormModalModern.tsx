import React, { useState, useEffect } from 'react';
import { Employee, Gender, ContractType, EmployeeStatus, PaymentMethod, EmployeeFormData, TreasuryAccount, AccountType } from '../../types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Button from '../ui/Button';
import FormSection from '../ui/FormSection';
import Card, { CardHeader, CardBody } from '../ui/Card';
import CameroonPayrollWidget from './CameroonPayrollWidget';
import LeaveBalanceWidget from './LeaveBalanceWidget';
import DocumentUploadSection from './DocumentUploadSection';
import LeaveManagementSection from './LeaveManagementSection';
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasury';
import { Plus, Edit, User, Briefcase, DollarSign, FileText, Umbrella } from '../ui/Icons';

interface EmployeeFormModalModernProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: EmployeeFormData) => void;
  employee: Employee | null;
}

type FormTab = 'personal' | 'professional' | 'salary' | 'documents' | 'leaves';

interface FormErrors {
  [key: string]: string;
}

const EmployeeFormModalModern: React.FC<EmployeeFormModalModernProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
}) => {
  const { t } = useI18n();
  const { subsidiary } = useAuth();
  const [activeTab, setActiveTab] = useState<FormTab>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>([]);

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
    targetNetSalary: 0,
    salaryInputMode: 'NET' as const,
    benefits: [],
    lastSalaryAdjustmentDate: null,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    bankName: '',
    bankAccountNumber: '',
    allowances: 0,
    indemnities: [],
    documents: { contract: null, idCard: null, workPermit: null, diplomas: [] },
    leaveBalance: { annual: 0, sick: 0, personal: 0, maternity: 0, paternity: 0, other: 0, unpaid: 0 },
    leaveRecords: [],
    numberDependents: 0,
    situationMatrimony: 'SINGLE',
  };

  const [formData, setFormData] = useState<any>(initialFormState);
  const [newIndemnitiesForm, setNewIndemnitiesForm] = useState({ type: '', amount: 0 });

  const indemnitiesOptions = [
    { value: 'housing', label: 'Indemnité de logement' },
    { value: 'transport', label: 'Indemnité de transport' },
    { value: 'meals', label: 'Indemnité de repas' },
    { value: 'family', label: 'Indemnité familiale' },
    { value: 'representation', label: 'Indemnité de représentation' },
    { value: 'health_insurance', label: 'Assurance maladie' },
    { value: 'life_insurance', label: 'Assurance vie' },
    { value: 'mobile_allowance', label: 'Allocation téléphone' },
    { value: 'internet_allowance', label: 'Allocation internet' },
    { value: 'other', label: 'Autre indemnité' },
  ];

  useEffect(() => {
    if (employee) {
      setFormData({
        ...initialFormState,
        ...employee,
        birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        indemnities: Array.isArray(employee.indemnities) ? employee.indemnities : [],
        documents: {
          contract: employee.documents?.contract || null,
          idCard: employee.documents?.idCard || null,
          workPermit: employee.documents?.workPermit || null,
          diplomas: Array.isArray(employee.documents?.diplomas) ? employee.documents.diplomas : [],
        },
        leaveBalance: {
          annual: employee.leaveBalance?.annual ?? 0,
          sick: employee.leaveBalance?.sick ?? 0,
          personal: employee.leaveBalance?.personal ?? 0,
          maternity: employee.leaveBalance?.maternity ?? 0,
          paternity: employee.leaveBalance?.paternity ?? 0,
          other: employee.leaveBalance?.other ?? 0,
          unpaid: employee.leaveBalance?.unpaid ?? 0,
        },
        leaveRecords: Array.isArray(employee.leaveRecords) ? employee.leaveRecords : [],
      });
    } else {
      setFormData(initialFormState);
    }
    setActiveTab('personal');
    setErrors({});
  }, [employee, isOpen]);

  useEffect(() => {
    const loadTreasuryAccounts = async () => {
      try {
        if (subsidiary?.id) {
          const accounts = await getTreasuryAccounts(subsidiary.id);
          setTreasuryAccounts(accounts.filter(acc => acc.accountType === AccountType.BANQUE));
        }
      } catch (error) {
        console.error('Error loading treasury accounts:', error);
      }
    };

    if (isOpen) {
      loadTreasuryAccounts();
    }
  }, [isOpen, subsidiary]);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email format';
      case 'phone':
        return /^[+]?[0-9\s\-()]{7,20}$/.test(value) ? null : 'Invalid phone format';
      case 'targetNetSalary':
        return value > 0 ? null : 'Net salary must be > 0';
      case 'birthDate': {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age >= 16 ? null : 'Employee must be at least 16 years old';
      }
      case 'hireDate':
        return new Date(value) >= new Date(formData.birthDate) ? null : 'Hire date must be after birth date';
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['bonus', 'numberDependents', 'targetNetSalary'];
    const actualValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

    setFormData((prev: any) => ({ ...prev, [name]: actualValue }));

    const error = validateField(name, actualValue);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDocumentsUpdate = (documents: any) => {
    setFormData((prev: any) => ({ ...prev, documents }));
  };

  const handleLeaveBalanceUpdate = (leaveBalance: any) => {
    setFormData((prev: any) => ({ ...prev, leaveBalance }));
  };

  const handleLeaveRecordsUpdate = (leaveRecords: any) => {
    setFormData((prev: any) => ({ ...prev, leaveRecords }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    const newErrors: FormErrors = {};
    const fieldsToValidate = ['email', 'phone', 'targetNetSalary', 'birthDate', 'hireDate'];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Ensure data persistence by explicitly including all nested objects
      const dataToSave = {
        ...formData,
        salaryInputMode: 'NET' as const,
        bankName: formData.bankName || '',
        bankAccountNumber: formData.bankAccountNumber || '',
        documents: {
          contract: formData.documents?.contract || null,
          idCard: formData.documents?.idCard || null,
          workPermit: formData.documents?.workPermit || null,
          diplomas: Array.isArray(formData.documents?.diplomas) ? formData.documents.diplomas : [],
        },
        leaveBalance: {
          annual: formData.leaveBalance?.annual ?? 0,
          sick: formData.leaveBalance?.sick ?? 0,
          personal: formData.leaveBalance?.personal ?? 0,
          maternity: formData.leaveBalance?.maternity ?? 0,
          paternity: formData.leaveBalance?.paternity ?? 0,
          other: formData.leaveBalance?.other ?? 0,
          unpaid: formData.leaveBalance?.unpaid ?? 0,
        },
        leaveRecords: Array.isArray(formData.leaveRecords) ? formData.leaveRecords : [],
      };

      onSave(dataToSave);
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabConfigs = {
    personal: { icon: User, translationKey: 'hr.form.sections.personal' },
    professional: { icon: Briefcase, translationKey: 'hr.form.sections.professional' },
    salary: { icon: DollarSign, translationKey: 'hr.form.sections.salary' },
    documents: { icon: FileText, translationKey: 'hr.form.sections.documents' },
    leaves: { icon: Umbrella, translationKey: 'hr.form.sections.leaves' },
  };

  const TabButton = ({ tab }: { tab: FormTab }) => {
    const config = tabConfigs[tab];
    const Icon = config.icon;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
          activeTab === tab
            ? 'border-b-2 border-[#c6e911] text-[#c6e911] bg-slate-50'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Icon size={18} />
        {t(config.translationKey)}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader gradient>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {employee ? (
              <>
                <Edit size={28} />
                {t('hr.editEmployee')}
              </>
            ) : (
              <>
                <Plus size={28} />
                {t('hr.addEmployee')}
              </>
            )}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {employee
              ? t('configuration.modal.editEmployeeTitle')
              : t('configuration.modal.addEmployeeTitle')}
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          {/* Tabs Navigation */}
          <div className="flex space-x-1 px-6 pt-4 border-b border-slate-200 overflow-x-auto">
            <TabButton tab="personal" />
            <TabButton tab="professional" />
            <TabButton tab="salary" />
            <TabButton tab="documents" />
            <TabButton tab="leaves" />
          </div>

          <CardBody className="max-h-[60vh] overflow-y-auto">
            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <FormSection title={t('hr.form.sections.personal')} subtitle={t('hr.form.sections.personal')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('configuration.form.firstName')}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    required
                  />
                  <FormInput
                    label={t('configuration.form.lastName')}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('configuration.form.birthDate')}
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    error={errors.birthDate}
                    required
                  />
                  <FormSelect
                    label={t('configuration.form.gender')}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    options={Object.entries(Gender).map(([, v]) => ({
                      value: v,
                      label: t(`hr.gender.${v}`),
                    }))}
                  />
                </div>

                <FormInput
                  label={t('configuration.form.email')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />

                <FormInput
                  label={t('configuration.form.phone')}
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('configuration.form.nationality')}
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                  <FormInput
                    label={t('configuration.form.ssn')}
                    name="socialSecurityNumber"
                    value={formData.socialSecurityNumber}
                    onChange={handleChange}
                  />
                </div>

                <FormInput
                  label={t('configuration.form.address')}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label={t('hr.maritalStatus')}
                    name="situationMatrimony"
                    value={formData.situationMatrimony}
                    onChange={handleChange}
                    options={[
                      { value: 'SINGLE', label: t('hr.maritalStatusOptions.SINGLE') },
                      { value: 'MARRIED', label: t('hr.maritalStatusOptions.MARRIED') },
                      { value: 'DIVORCED', label: t('hr.maritalStatusOptions.DIVORCED') },
                      { value: 'WIDOWED', label: t('hr.maritalStatusOptions.WIDOWED') },
                    ]}
                  />
                  <FormInput
                    label={t('hr.numberDependents')}
                    name="numberDependents"
                    type="number"
                    value={formData.numberDependents}
                    onChange={handleChange}
                    helperText={t('hr.dependentsHelperText')}
                  />
                </div>
              </FormSection>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <FormSection title={t('hr.form.sections.professional')} subtitle={t('hr.form.sections.professional')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('configuration.form.position')}
                    name="positions"
                    value={formData.positions}
                    onChange={handleChange}
                    required
                  />
                  <FormInput
                    label={t('configuration.form.department')}
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('configuration.form.hireDate')}
                    name="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={handleChange}
                    error={errors.hireDate}
                    required
                  />
                  <FormSelect
                    label={t('configuration.form.contractType')}
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    required
                    options={Object.entries(ContractType).map(([, v]) => ({
                      value: v,
                      label: t(`hr.contractType.${v}`),
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label={t('configuration.form.employeeStatus')}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    options={Object.entries(EmployeeStatus).map(([, v]) => ({
                      value: v,
                      label: t(`hr.employeeStatus.${v}`),
                    }))}
                  />
                  <FormInput
                    label={t('configuration.form.workLocation')}
                    name="workLocation"
                    value={formData.workLocation}
                    onChange={handleChange}
                  />
                </div>
              </FormSection>
            )}

            {/* Salary Tab */}
            {activeTab === 'salary' && (
              <FormSection title={t('hr.form.salarySection.title')} subtitle={t('hr.form.salarySection.subtitle')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label={t('hr.form.salarySection.targetNetSalary') || 'Salaire net souhaité'}
                    name="targetNetSalary"
                    type="number"
                    value={formData.targetNetSalary}
                    onChange={handleChange}
                    error={errors.targetNetSalary}
                    helperText={t('hr.form.salarySection.targetNetSalaryHelper') || 'Salaire net souhaité mensuel (FCFA)'}
                    required
                  />
                  <FormInput
                    label={t('hr.form.salarySection.bonus')}
                    name="bonus"
                    type="number"
                    value={formData.bonus}
                    onChange={handleChange}
                    helperText={t('hr.form.salarySection.bonusHelper')}
                  />
                </div>

                {/* Indemnités Section */}
                <div className="mt-6 p-5 border border-slate-200 rounded-lg bg-white">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Indemnités</h3>
                    <p className="text-xs text-slate-600">Indemnités et primes (logement, transport...).</p>
                  </div>

                  {/* Liste des indemnités existantes */}
                  <div className="space-y-2 mb-4">
                    {(formData.indemnities || []).map((indemnity: any, index: number) => {
                      const indemLabel = indemnitiesOptions.find(opt => opt.value === indemnity.type)?.label || indemnity.type;
                      return (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {indemLabel} <span className="text-red-500">({(indemnity.amount || 0).toLocaleString('fr-FR')} FCFA)</span>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                indemnities: (formData.indemnities || []).filter((_: any, i: number) => i !== index)
                              });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formulaire d'ajout */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex gap-2">
                      <select
                        value={newIndemnitiesForm.type}
                        onChange={(e) => setNewIndemnitiesForm({ ...newIndemnitiesForm, type: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      >
                        <option value="">Type d'indemnité / avantage</option>
                        {indemnitiesOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={newIndemnitiesForm.amount}
                        onChange={(e) => setNewIndemnitiesForm({ ...newIndemnitiesForm, amount: Number(e.target.value) })}
                        placeholder="Montant"
                        step="0.01"
                        min="0"
                        className="w-32 px-3 py-2 border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <button
                        onClick={() => {
                          if (newIndemnitiesForm.type && newIndemnitiesForm.amount > 0) {
                            setFormData({
                              ...formData,
                              indemnities: [
                                ...(formData.indemnities || []),
                                { type: newIndemnitiesForm.type, amount: newIndemnitiesForm.amount }
                              ]
                            });
                            setNewIndemnitiesForm({ type: '', amount: 0 });
                          }
                        }}
                        className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-green-500 transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Résumé Total */}
                  {(formData.indemnities || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Total indemnités</span>
                      <span className="text-lg font-bold text-orange-600">
                        {((formData.indemnities || []) as any[]).reduce((sum, ind) => sum + (Number(ind.amount) || 0), 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  )}
                </div>

                <FormSelect
                  label={t('hr.form.salarySection.paymentMethod')}
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  error={errors.paymentMethod}
                  required
                  options={Object.entries(PaymentMethod).map(([, v]) => ({
                    value: v,
                    label: t(`hr.paymentMethod.${v}`),
                  }))}
                />

                {/* Bank Transfer Details - Conditional */}
                {formData.paymentMethod === PaymentMethod.BANK_TRANSFER && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-4">
                      {t('hr.bankingDetails')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {treasuryAccounts.length > 0 && (
                          <FormSelect
                            label={t('hr.bankName')}
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            options={[
                              { value: '', label: '-- Sélectionner une banque --' },
                              ...treasuryAccounts.map(account => ({
                                value: account.accountName,
                                label: `${account.accountName} (${account.currency})`
                              }))
                            ]}
                            helperText="Sélectionner parmi les comptes de trésorerie"
                          />
                        )}
                        <FormInput
                          label={treasuryAccounts.length > 0 ? t('hr.bankName') + " (texte libre)" : t('hr.bankName')}
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          placeholder="Ou entrez le nom de la banque"
                          helperText={treasuryAccounts.length > 0 ? "Valeur personnalisée ou autre banque" : ""}
                          required={formData.paymentMethod === PaymentMethod.BANK_TRANSFER}
                        />
                      </div>
                      <FormInput
                        label={t('hr.bankAccountNumber')}
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        placeholder="RIB/IBAN"
                        required={formData.paymentMethod === PaymentMethod.BANK_TRANSFER}
                      />
                    </div>
                  </div>
                )}

                {/* Cameroon Payroll Preview */}
                <div className="mt-6">
                  <CameroonPayrollWidget
                    netSalary={formData.targetNetSalary}
                    bonus={formData.bonus}
                    numberDependents={formData.numberDependents}
                  />
                </div>
              </FormSection>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <FormSection title={t('hr.form.documentsSection.title')} subtitle={t('hr.form.documentsSection.subtitle')}>
                <DocumentUploadSection
                  documents={formData.documents}
                  onUpdate={handleDocumentsUpdate}
                />
              </FormSection>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
              <FormSection title={t('hr.form.leavesSection.title')} subtitle={t('hr.form.leavesSection.subtitle')}>
                <LeaveManagementSection
                  leaveBalance={formData.leaveBalance}
                  leaveRecords={formData.leaveRecords}
                  onBalanceUpdate={handleLeaveBalanceUpdate}
                  onRecordsUpdate={handleLeaveRecordsUpdate}
                />
              </FormSection>
            )}
          </CardBody>

          {/* Footer with Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {t('hr.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              leftIcon={employee ? <Edit size={18} /> : <Plus size={18} />}
            >
              {employee ? t('hr.updateEmployee') : t('hr.addEmployee')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmployeeFormModalModern;
