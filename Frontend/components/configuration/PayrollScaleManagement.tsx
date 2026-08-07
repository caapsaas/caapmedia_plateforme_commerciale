import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../ui/Card';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import SmigUpdateModal from './SmigUpdateModal';
import CnpsRatesModal from './CnpsRatesModal';
import IrppBracketsModal from './IrppBracketsModal';
import LeaveEntitlementsModal from './LeaveEntitlementsModal';
import CameroonTaxRatesModal from './CameroonTaxRatesModal';
import {
  getFullPayrollConfiguration,
  updatePayrollConfiguration,
  PayrollConfig,
  TaxBracket,
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

  const [smigModalOpen, setSmigModalOpen] = useState(false);
  const [cnpsModalOpen, setCnpsModalOpen] = useState(false);
  const [irppModalOpen, setIrppModalOpen] = useState(false);
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

  const handleSaveCnps = async (data: {
    cnpsEmployeeRate: number;
    cnpsEmployerRate: number;
  }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, data);
      setConfig(updated);
      setSuccessMsg(t('hr.payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('hr.payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIrpp = async (data: { irppBrackets: TaxBracket[] }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, { irppBrackets: data.irppBrackets });
      setConfig(updated);
      setSuccessMsg(t('hr.payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setIrppModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hr.payroll.error.update'));
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

      <Card>
        <CardHeader gradient>
          <h3 className="text-xl font-bold">{t('hr.payroll.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('hr.payroll.taxBracketsDesc')}</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* SMIG Configuration */}
            <div className="border border-slate-200 rounded-lg p-4">
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
            </div>

            {/* CNPS Rates */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('hr.payroll.cnpsEmployeeRate')} {t('hr.payroll.form.employeeRate')} & {t('hr.payroll.form.employerRate')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.form.employeeRate')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.cnpsEmployeeRate || 0.054) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('hr.payroll.form.employerRate')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.cnpsEmployerRate || 0.064) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCnpsModalOpen(true)}
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {t('common.edit')}
              </button>
            </div>

            {/* IRPP Brackets */}
            <div className="border border-slate-200 rounded-lg p-4">
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
                    {(
                      config.taxBrackets || [
                        { minSalary: 0, maxSalary: 355000, rate: 0, deductible: 0 },
                        { minSalary: 355000, maxSalary: 545000, rate: 10, deductible: 35500 },
                        { minSalary: 545000, maxSalary: 1000000, rate: 15, deductible: 89000 },
                        { minSalary: 1000000, maxSalary: null, rate: 20, deductible: 170000 },
                      ]
                    ).map((bracket, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">
                          {(bracket.minSalary || 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-2">
                          {bracket.maxSalary === null
                            ? `${t('hr.payroll.form.above')} ${(bracket.minSalary || 0).toLocaleString('fr-FR')}`
                            : (bracket.maxSalary || 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          {typeof bracket.rate === 'number'
                            ? (bracket.rate > 1 ? bracket.rate : (bracket.rate * 100)).toFixed(2)
                            : bracket.rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => setIrppModalOpen(true)}
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#c6e911] text-slate-800 rounded-lg font-semibold hover:bg-[#adc40f] transition-colors disabled:opacity-50"
              >
                {t('common.edit')}
              </button>
            </div>

            {/* Cameroon Tax Rates */}
            <div className="border border-slate-200 rounded-lg p-4">
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
            </div>

            {/* Leave Entitlements */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('hr.payroll.modal.updateLeaveTitle')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(config.leaveEntitlements || [
                  { type: t('hr.leaveType.annual'), daysPerYear: 30, isPaid: true },
                  { type: t('hr.leaveType.sick'), daysPerYear: 15, isPaid: true },
                  { type: t('hr.leaveType.maternity'), daysPerYear: 56, isPaid: true },
                  { type: t('hr.leaveType.paternity'), daysPerYear: 3, isPaid: true },
                ]).map((leave, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      {leave.type} {leave.isPaid ? `(${t('hr.payroll.form.paid')})` : `(${t('hr.payroll.form.unpaid')})`}
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
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Info Box */}
      <Card>
        <CardBody>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ℹ️ <strong>{t('hr.payroll.infoBox.title')}:</strong> {t('hr.payroll.infoBoxText')}
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

      <CnpsRatesModal
        isOpen={cnpsModalOpen}
        onClose={() => setCnpsModalOpen(false)}
        onSave={handleSaveCnps}
        employeeRate={config.cnpsEmployeeRate || 0.11}
        employerRate={config.cnpsEmployerRate || 0.176}
        isLoading={saving}
      />

      <IrppBracketsModal
        isOpen={irppModalOpen}
        onClose={() => setIrppModalOpen(false)}
        onSave={handleSaveIrpp}
        brackets={
          config.taxBrackets?.map(b => ({
            ...b,
            minAmount: b.minSalary,
            maxAmount: b.maxSalary,
          })) || [
            { minAmount: 0, maxAmount: 355000, rate: 0 },
            { minAmount: 355000, maxAmount: 545000, rate: 0.1 },
            { minAmount: 545000, maxAmount: 1000000, rate: 0.15 },
            { minAmount: 1000000, maxAmount: null, rate: 0.2 },
          ]
        }
        isLoading={saving}
      />

      <LeaveEntitlementsModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onSave={handleSaveLeave}
        entitlements={
          config.leaveEntitlements || [
            { type: t('hr.leaveType.annual'), daysPerYear: 30, isPaid: true },
            { type: t('hr.leaveType.sick'), daysPerYear: 15, isPaid: true },
            { type: t('hr.leaveType.maternity'), daysPerYear: 56, isPaid: true },
            { type: t('hr.leaveType.paternity'), daysPerYear: 3, isPaid: true },
          ]
        }
        isLoading={saving}
      />

      <CameroonTaxRatesModal
        isOpen={cameroonTaxModalOpen}
        onClose={() => setCameroonTaxModalOpen(false)}
        onSave={handleSaveCameroonTax}
        cfcEmployeeRate={config.cfcEmployeeRate || 0.01}
        cfcEmployerRate={config.cfcEmployerRate || 0.015}
        fneRate={config.fneRate || 0.01}
        cnpsCap={config.cnpsCap || 750000}
        professionalExpenseRate={config.professionalExpenseRate || 0.30}
        fixedAbatementAnnual={config.fixedAbatementAnnual || 500000}
        riskGroupARate={config.riskGroupARate || 0.0175}
        riskGroupBRate={config.riskGroupBRate || 0.025}
        riskGroupCRate={config.riskGroupCRate || 0.05}
        isLoading={saving}
      />
    </div>
  );
};

export default PayrollScaleManagement;
