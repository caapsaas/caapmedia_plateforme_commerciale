import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../ui/Card';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import SmigUpdateModal from './SmigUpdateModal';
import LeaveEntitlementsModal from './LeaveEntitlementsModal';
import CameroonTaxRatesModal from './CameroonTaxRatesModal';
import {
  getFullPayrollConfiguration,
  updatePayrollConfiguration,
  PayrollConfig,
  LeaveEntitlement,
} from '../../services/apihr/apiPayroll';

// `config.minWageEffectiveDate` était affiché brut (ISO) au lieu d'une date localisée.
const fmtDate = (date?: string | null, language = 'fr') => {
  if (!date) return '—';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language);
};

const PayrollScaleManagement: React.FC = () => {
  const { t, language } = useI18n();
  const { subsidiary } = useAuth();
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'minimum' | 'contributions' | 'tax' | 'leaves'>('overview');
  const showSection = (section: typeof activeSection) => activeSection === section;

  const [smigModalOpen, setSmigModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [cameroonTaxModalOpen, setCameroonTaxModalOpen] = useState(false);

  const subsidiaryId = subsidiary?.id || '';

  useEffect(() => {
    if (subsidiaryId) {
      loadConfiguration();
    }
  }, [subsidiaryId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFullPayrollConfiguration(subsidiaryId);
      setConfig(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('hr.payroll.error.update');
      setError(errorMsg);
      console.error('Error loading payroll configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmig = async (data: { minWage: number; minWageEffectiveDate: string }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, data);
      setConfig(updated);
      setSuccessMsg(t('hr.payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Full error from backend:', err);
      console.error('Error response:', err.response?.data);
      throw new Error(err instanceof Error ? err.message : t('hr.payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLeave = async (data: { leaveEntitlements: LeaveEntitlement[] }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, { leaveEntitlements: data.leaveEntitlements });
      setConfig(updated);
      setSuccessMsg(t('hr.payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setLeaveModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hr.payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCameroonTax = async (data: {
    cfcEmployeeRate?: number;
    cfcEmployerRate?: number;
    fneRate?: number;
    cnpsCap?: number;
    professionalExpenseRate?: number;
    fixedAbatementAnnual?: number;
    riskGroupARate?: number;
    riskGroupBRate?: number;
    riskGroupCRate?: number;
  }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, data);
      setConfig(updated);
      setSuccessMsg(t('hr.payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setCameroonTaxModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hr.payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  if (!subsidiary || loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader gradient>
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <div className="h-4 w-56 bg-slate-200 rounded animate-pulse mb-3" />
                  <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error || t('hr.payroll.error.update')}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <Card>
          <CardBody>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card>
          <CardBody>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <nav className="flex flex-wrap gap-2" aria-label="Rubriques de configuration de paie">
        {([
          ['overview', t('hr.payroll.sections.overview')],
          ['minimum', t('hr.payroll.sections.minimum')],
          ['contributions', t('hr.payroll.sections.contributions')],
          ['tax', t('hr.payroll.sections.tax')],
          ['leaves', t('hr.payroll.sections.leaves')],
        ] as const).map(([section, label]) => (
          <button key={section} type="button" onClick={() => setActiveSection(section)} aria-current={activeSection === section ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeSection === section ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </nav>

      {showSection('overview') && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: t('hr.payroll.sections.salaryMinimumTitle'), value: `${config.minWage?.toLocaleString('fr-FR')} FCFA`, detail: `${t('hr.payroll.sections.salaryMinimumDetail')} · ${fmtDate(config.minWageEffectiveDate, language)}`, section: 'minimum' as const },
          { title: t('hr.payroll.sections.employeePensionTitle'), value: '4,2 %', detail: t('hr.payroll.sections.employeePensionDetail'), section: 'contributions' as const },
          { title: t('hr.payroll.sections.employerPensionTitle'), value: '4,2 % + branches', detail: t('hr.payroll.sections.employerPensionDetail'), section: 'contributions' as const },
          { title: t('hr.payroll.sections.annualLeaveTitle'), value: t('hr.payroll.sections.annualLeaveValue'), detail: t('hr.payroll.sections.annualLeaveDetail'), section: 'leaves' as const },
        ].map((item) => <button key={item.title} type="button" onClick={() => setActiveSection(item.section)} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-slate-400">
          <span className="text-sm font-medium text-slate-500">{item.title}</span><span className="mt-2 block text-xl font-bold text-slate-900">{item.value}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span><span className="mt-4 block text-xs font-semibold text-slate-700">{t('hr.payroll.sections.manage')}</span>
        </button>)}
      </div>}

      {!showSection('overview') && <Card>
        <CardHeader gradient>
          <h3 className="text-xl font-bold">{t('hr.payroll.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('hr.payroll.taxBracketsDesc')}</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* SMIG Configuration */}
            {showSection('minimum') && <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {t('hr.payroll.form.minWage')}
                  </h4>
                  <p className="text-sm text-slate-600">{t('hr.payroll.modal.updateSmigDesc')}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#c6e911]">
                    {config.minWage?.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(config.minWageEffectiveDate, language)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSmigModalOpen(true)}
                disabled={saving}
                className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {t('common.edit')}
              </button>
            </div>}

            {/* CNPS Rates */}
            {showSection('contributions') && <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('payroll.cnpsEmployeeRate')} {t('hr.payroll.form.employeeRate')} & {t('hr.payroll.form.employerRate')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.form.employeeRate')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    4,20 %
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.form.employerRate')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    4,20 %
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('hr.payroll.sections.cnpsBreakdown')}</p>
            </div>}

            {/* IRPP Brackets */}
            {showSection('tax') && <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('hr.payroll.modal.updateIrppTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('hr.payroll.form.minAmount')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('hr.payroll.form.maxAmount')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('hr.payroll.form.rate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { minSalary: 0, maxSalary: 2000000, rate: 10 },
                      { minSalary: 2000001, maxSalary: 3000000, rate: 15 },
                      { minSalary: 3000001, maxSalary: 5000000, rate: 25 },
                      { minSalary: 5000001, maxSalary: null, rate: 35 },
                    ].map((bracket, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">
                          {(bracket.minSalary || 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-2">
                          {bracket.maxSalary === null
                            ? `${t('hr.payroll.form.above')} ${(bracket.minSalary || 0).toLocaleString('fr-FR')}`
                            : (bracket.maxSalary || 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 font-semibold">{bracket.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('hr.payroll.sections.irppLegalNote')}</p>
            </div>}

            {/* Cameroon Tax Rates */}
            {showSection('contributions') && <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('hr.payroll.cameroonTaxRates.title')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.cfcEmployee')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.cfcEmployeeRate || 0.01) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.cfcEmployer')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.cfcEmployerRate || 0.015) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.fne')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.fneRate || 0.01) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.cnpsCap')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {(config.cnpsCap || 750000).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.professionalExpense')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.professionalExpenseRate || 0.30) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.cameroonTaxRates.fixedAbatement')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {(config.fixedAbatementAnnual || 500000).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  {t('hr.payroll.cameroonTaxRates.riskRates')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600 font-semibold">Groupe A</p>
                    <p className="text-lg font-bold mt-1">
                      {((config.riskGroupARate || 0.0175) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600 font-semibold">Groupe B</p>
                    <p className="text-lg font-bold mt-1">
                      {((config.riskGroupBRate || 0.025) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-600 font-semibold">Groupe C</p>
                    <p className="text-lg font-bold mt-1">
                      {((config.riskGroupCRate || 0.05) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCameroonTaxModalOpen(true)}
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {t('common.edit')}
              </button>
            </div>}

            {/* Leave Entitlements */}
            {showSection('leaves') && <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('hr.payroll.modal.updateLeaveTitle')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(config.leaveEntitlements?.length ? config.leaveEntitlements : [
                  { type: 'ANNUAL', daysPerYear: 18, isPaid: true, description: '1,5 jour ouvrable par mois de service effectif (Code du travail, art. 89).' },
                ]).map((leave, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      {(leave.type === 'ANNUAL' ? t('hr.leaveType.annual') : leave.type)} {leave.isPaid ? `(${t('hr.payroll.form.paid')})` : `(${t('hr.payroll.form.unpaid')})`}
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      {leave.daysPerYear} {t('hr.payroll.form.daysPerYear')}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setLeaveModalOpen(true)}
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {t('common.edit')}
              </button>
            </div>}
          </div>
        </CardBody>
      </Card>}

      {/* Info Box */}
      <Card>
        <CardBody>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ℹ️ <strong>{t('hr.payroll.infoBox.title')}:</strong> {t('hr.payroll.infoBox.text')}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <SmigUpdateModal
        isOpen={smigModalOpen}
        onClose={() => setSmigModalOpen(false)}
        onSave={handleSaveSmig}
        currentValue={config.minWage || 70000}
        currentDate={config.minWageEffectiveDate || new Date().toISOString().split('T')[0]}
        isLoading={saving}
      />

      <LeaveEntitlementsModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onSave={handleSaveLeave}
        entitlements={
          config.leaveEntitlements?.length ? config.leaveEntitlements : [
            { type: 'ANNUAL', daysPerYear: 18, isPaid: true, description: '1,5 jour ouvrable par mois de service effectif (Code du travail, art. 89).' },
          ]
        }
        isLoading={saving}
      />

      <CameroonTaxRatesModal
        isOpen={cameroonTaxModalOpen}
        onClose={() => setCameroonTaxModalOpen(false)}
        onSave={handleSaveCameroonTax}
        cfcEmployeeRate={config.cfcEmployeeRate ?? 0.01}
        cfcEmployerRate={config.cfcEmployerRate ?? 0.015}
        fneRate={config.fneRate ?? 0.01}
        cnpsCap={config.cnpsCap ?? 750000}
        professionalExpenseRate={config.professionalExpenseRate ?? 0.30}
        fixedAbatementAnnual={config.fixedAbatementAnnual ?? 500000}
        riskGroupARate={config.riskGroupARate ?? 0.0175}
        riskGroupBRate={config.riskGroupBRate ?? 0.025}
        riskGroupCRate={config.riskGroupCRate ?? 0.05}
        isLoading={saving}
      />
    </div>
  );
};

export default PayrollScaleManagement;
