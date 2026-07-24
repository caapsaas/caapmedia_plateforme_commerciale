import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../ui/Card';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import SmigUpdateModal from './SmigUpdateModal';
import CnpsRatesModal from './CnpsRatesModal';
import IrppBracketsModal from './IrppBracketsModal';
import LeaveEntitlementsModal from './LeaveEntitlementsModal';
import {
  getFullPayrollConfiguration,
  updatePayrollConfiguration,
  PayrollConfig,
  TaxBracket,
  LeaveEntitlement,
} from '../../services/apihr/apiPayroll';

const PayrollScaleManagement: React.FC = () => {
  const { t } = useI18n();
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
      const errorMsg = err instanceof Error ? err.message : t('payroll.error.update');
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
      setSuccessMsg(t('payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('payroll.error.update'));
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
      setSuccessMsg(t('payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t('payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIrpp = async (data: { irppBrackets: TaxBracket[] }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, { irppBrackets: data.irppBrackets });
      setConfig(updated);
      setSuccessMsg(t('payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setIrppModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLeave = async (data: { leaveEntitlements: LeaveEntitlement[] }) => {
    setSaving(true);
    try {
      const updated = await updatePayrollConfiguration(subsidiaryId, { leaveEntitlements: data.leaveEntitlements });
      setConfig(updated);
      setSuccessMsg(t('payroll.success.updated'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setLeaveModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payroll.error.update'));
    } finally {
      setSaving(false);
    }
  };

  if (!subsidiary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error || t('payroll.error.update')}</p>
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
          <h3 className="text-xl font-bold">{t('payroll.title')}</h3>
          <p className="text-sm text-slate-600 mt-1">{t('payroll.taxBracketsDesc')}</p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* SMIG Configuration */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {t('payroll.form.minWage')}
                  </h4>
                  <p className="text-sm text-slate-600">{t('payroll.modal.updateSmigDesc')}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#c6e911]">
                    {config.minWage?.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-slate-500">
                    {config.minWageEffectiveDate}
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
                {t('payroll.cnpsEmployeeRate')} {t('payroll.form.employeeRate')} & {t('payroll.form.employerRate')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('payroll.form.employeeRate')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {((config.cnpsEmployeeRate || 0.054) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 uppercase font-semibold">
                    {t('payroll.form.employerRate')}
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
                {t('payroll.modal.updateIrppTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('payroll.form.minAmount')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('payroll.form.maxAmount')}
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        {t('payroll.form.rate')}
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
                            ? `${t('payroll.form.above')} ${(bracket.minSalary || 0).toLocaleString('fr-FR')}`
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

            {/* Leave Entitlements */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">
                {t('payroll.modal.updateLeaveTitle')}
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
                      {leave.type} {leave.isPaid ? `(${t('payroll.form.paid')})` : `(${t('payroll.form.unpaid')})`}
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      {leave.daysPerYear} {t('payroll.form.daysPerYear')}
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
              ℹ️ <strong>{t('payroll.infoBox.title')}:</strong> {t('payroll.infoBoxText')}
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
    </div>
  );
};

export default PayrollScaleManagement;
