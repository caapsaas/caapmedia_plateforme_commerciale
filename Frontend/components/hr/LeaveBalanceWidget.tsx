import React from 'react';
import { useI18n } from '../../i18n';
import Card, { CardBody, CardHeader } from '../ui/Card';

interface LeaveBalance {
  annual: number;
  sick: number;
  personal: number;
  maternity: number;
  paternity: number;
  other: number;
  unpaid?: number;
}

interface LeaveBalanceWidgetProps {
  leaveBalance: LeaveBalance;
}

const getLeaveTypes = (t: any) => [
  { key: 'annual', label: t('hr.leaveType.annual') },
  { key: 'sick', label: t('hr.leaveType.sick') },
  { key: 'personal', label: t('hr.leaveType.personal') },
  { key: 'maternity', label: t('hr.leaveType.maternity') },
  { key: 'paternity', label: t('hr.leaveType.paternity') },
  { key: 'other', label: t('hr.leaveType.other') },
];

const LeaveBalanceWidget: React.FC<LeaveBalanceWidgetProps> = ({ leaveBalance }) => {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader gradient>
        <h3 className="font-semibold text-slate-900">{t('hr.leaveBalance.title')}</h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {getLeaveTypes(t).map((leave) => {
            const value = leaveBalance[leave.key as keyof LeaveBalance] || 0;

            return (
              <div key={leave.key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-700">{leave.label}</p>
                <p className="text-lg font-bold text-slate-900">{value} <span className="text-xs font-medium text-slate-500">{t('hr.leaveBalance.days')}</span></p>
              </div>
            );
          })}

          {leaveBalance.unpaid !== undefined && leaveBalance.unpaid > 0 && (
            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <p className="text-sm font-semibold text-slate-700">
                {t('hr.leaveBalance.unpaidLeave')}: <span className="text-red-600">{leaveBalance.unpaid.toFixed(1)} {t('hr.leaveBalance.days')}</span>
              </p>
            </div>
          )}

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">{t('hr.leaveBalance.totalEntitlements')}</p>
            <p className="text-lg font-bold text-slate-900">
              {Number(
                Object.entries(leaveBalance)
                  .filter(([key]) => key !== 'unpaid')
                  .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0)
              ).toFixed(1)}{' '}
              {t('hr.leaveBalance.days')}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default LeaveBalanceWidget;
