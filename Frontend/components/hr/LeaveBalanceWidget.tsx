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
  { key: 'annual', label: t('hr.leaveType.annual'), max: 30, color: 'from-green-400 to-green-600' },
  { key: 'sick', label: t('hr.leaveType.sick'), max: 15, color: 'from-yellow-400 to-yellow-600' },
  { key: 'personal', label: t('hr.leaveType.personal'), max: 10, color: 'from-blue-400 to-blue-600' },
  { key: 'maternity', label: t('hr.leaveType.maternity'), max: 56, color: 'from-pink-400 to-pink-600' },
  { key: 'paternity', label: t('hr.leaveType.paternity'), max: 3, color: 'from-purple-400 to-purple-600' },
  { key: 'other', label: t('hr.leaveType.other'), max: 10, color: 'from-slate-400 to-slate-600' },
];

const LeaveBalanceWidget: React.FC<LeaveBalanceWidgetProps> = ({ leaveBalance }) => {
  const { t } = useI18n();

  const getPercentage = (key: string, value: number, max: number): number => {
    return Math.min((value / max) * 100, 100);
  };

  return (
    <Card>
      <CardHeader gradient>
        <h3 className="font-semibold text-slate-900">{t('hr.leaveBalance.title')}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {getLeaveTypes(t).map((leave) => {
            const value = leaveBalance[leave.key as keyof LeaveBalance] || 0;
            const percentage = getPercentage(leave.key, value, leave.max);

            return (
              <div key={leave.key}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-slate-700">{leave.label}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {value.toFixed(1)} / {leave.max} {t('hr.leaveBalance.days')}
                  </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${leave.color} rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
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
