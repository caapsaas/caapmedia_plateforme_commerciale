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
import { getTreasuryAccounts } from '../../services/apiFinance/apiTreasuryAccounts';
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
    benefits: [],
    lastSalaryAdjustmentDate: null,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    bankName: '',
    bankAccountNumber: '',
    documents: { contract: null, idCard: null, workPermit: null, diplomas: [] },
    leaveBalance: { annual: 0, sick: 0, personal: 0, maternity: 0, paternity: 0, other: 0, unpaid: 0 },
    leaveRecords: [],
    numberDependents: 0,
    situationMatrimony: 'SINGLE',
  };

  const [formData, setFormData] = useState<any>(initialFormState);

  useEffect(() => {
    if (employee) {
      setFormData({
        ...initialFormState,
        ...employee,
        birthDate: employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        documents: {
          contract: employee.documents?.contract || null,
          idCard: employee.documents?.idCard || null,
          workPermit: employee.documents?.workPermit || null,
          diplomas: employee.documents?.diplomas || [],
        },
      });
    } else {
      setFormData(initialFormState);
    }
    setActiveTab('personal');
    setErrors({});
  }, [employee, isOpen]);

  // Charger les comptes de trésorerie de type BANQUE
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
      case 'baseSalary':
        return value >= 0 ? null : 'Salary must be >= 0';
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
    const numericFields = ['baseSalary', 'bonus', 'numberDependents'];
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
    const fieldsToValidate = ['email', 'phone', 'baseSalary', 'birthDate', 'hireDate'];

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
      onSave(formData);
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
                    label={t('hr.form.salarySection.baseSalary')}
                    name="baseSalary"
                    type="number"
                    value={formData.baseSalary}
                    onChange={handleChange}
                    error={errors.baseSalary}
                    helperText={t('hr.form.salarySection.baseSalaryHelper')}
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

                <FormSelect
                  label={t('hr.form.salarySection.paymentMethod')}
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
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
                          required
                        />
                      </div>
                      <FormInput
                        label={t('hr.bankAccountNumber')}
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        placeholder="RIB/IBAN"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Cameroon Payroll Preview */}
                <div className="mt-6">
                  <CameroonPayrollWidget
                    baseSalary={formData.baseSalary}
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
