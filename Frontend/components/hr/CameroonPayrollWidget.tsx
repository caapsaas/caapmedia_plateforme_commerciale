import React from 'react';
import Card, { CardBody, CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import { useI18n } from '../../i18n';
import { AlertTriangle } from '../ui/Icons';

interface CameroonPayrollWidgetProps {
  netSalary: number | string;
  bonus?: number | string;
  numberDependents?: number;
}

const SMIG_2024 = 70000; // FCFA
const CNPS_EMPLOYEE_RATE = 0.11;
const CNPS_EMPLOYER_RATE = 0.176;

const CameroonPayrollWidget: React.FC<CameroonPayrollWidgetProps> = ({
  netSalary,
  bonus = 0,
  numberDependents = 0,
}) => {
  const { t } = useI18n();
  const netSalaryNum = typeof netSalary === 'number' ? netSalary : Number(netSalary) || 0;
  const bonusNum = typeof bonus === 'number' ? bonus : Number(bonus) || 0;
  const totalNetSalary = netSalaryNum + bonusNum;
  const cnpsDeduction = Math.round(totalNetSalary * CNPS_EMPLOYEE_RATE);
  const employerContribution = Math.round(totalNetSalary * CNPS_EMPLOYER_RATE);
  const isBelowSMIG = totalNetSalary < SMIG_2024;

  return (
    <Card>
      <CardHeader gradient>
        <h3 className="font-semibold text-slate-900">{t('hr.payrollInfo.cameroonPayroll')}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {/* SMIG Check */}
          {isBelowSMIG && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                {t('hr.payrollInfo.belowSmig')}
              </p>
              <p className="text-xs text-red-600">
                Current: {totalNetSalary.toLocaleString()} {t('hr.payrollInfo.fcfa')} | {t('hr.payrollInfo.smig')}: {SMIG_2024.toLocaleString()} {t('hr.payrollInfo.fcfa')}
              </p>
            </div>
          )}

          {/* Net Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">{t('hr.payrollInfo.netSalary') || 'Salaire net'}</p>
              <p className="text-lg font-bold text-slate-900">{totalNetSalary.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{t('hr.payrollInfo.fcfa')}/month</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">{t('hr.payrollInfo.smig')}</p>
              <p className="text-lg font-bold text-slate-900">{SMIG_2024.toLocaleString()}</p>
              <Badge variant={isBelowSMIG ? 'danger' : 'success'} size="sm">
                {isBelowSMIG ? t('common.search') : 'Above'} SMIG
              </Badge>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Deductions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase">{t('hr.payrollInfo.deductions')}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{t('hr.payrollInfo.cnpsEmployee')}</span>
                <span className="font-semibold text-slate-900">{cnpsDeduction.toLocaleString()} {t('hr.payrollInfo.fcfa')}</span>
              </div>
              <div className="text-xs text-slate-500">
                <span>{t('hr.payrollInfo.cnpsEmployer')}: </span>
                <span className="font-semibold">
                  {employerContribution.toLocaleString()} {t('hr.payrollInfo.fcfa')}
                </span>
              </div>
            </div>
          </div>

          {numberDependents > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">{t('hr.payrollInfo.taxInfo')}</p>
              <p className="text-sm text-slate-700">
                {t('hr.payrollInfo.dependents')}: <span className="font-semibold">{numberDependents}</span>
              </p>
              <p className="text-xs text-slate-500">
                {t('hr.payrollInfo.taxReduction')}: {(numberDependents * 50000).toLocaleString()} {t('hr.payrollInfo.fcfa')}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default CameroonPayrollWidget;
