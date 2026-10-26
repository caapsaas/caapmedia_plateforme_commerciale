import React, { useMemo } from 'react';
import { Employee, EmployeeStatus } from '../../types';
import { useI18n } from '../../i18n';
import { Users, CheckCircle, Umbrella, Sparkles } from '../ui/Icons';

interface EmployeeStatsProps {
  employees: Employee[];
}

const EmployeeStats: React.FC<EmployeeStatsProps> = ({ employees }) => {
  const { t } = useI18n();

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length;
    const onLeave = employees.filter((e) => e.status === EmployeeStatus.ON_LEAVE).length;
    const recentlyAdded = employees.filter((e) => {
      const hireDate = new Date(e.hireDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return hireDate >= thirtyDaysAgo;
    }).length;

    return { total, active, onLeave, recentlyAdded };
  }, [employees]);

  const cards = [
    { title: t('hr.stats.totalEmployees'), value: stats.total, subtitle: t('hr.stats.totalEmployeesSubtitle'), icon: <Users size={18} />, tone: 'bg-slate-100 text-slate-600' },
    { title: t('hr.stats.active'), value: stats.active, subtitle: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% ${t('hr.stats.activeSubtitle')}`, icon: <CheckCircle size={18} />, tone: 'bg-emerald-50 text-emerald-700' },
    { title: t('hr.stats.onLeave'), value: stats.onLeave, subtitle: t('hr.stats.onLeaveSubtitle'), icon: <Umbrella size={18} />, tone: 'bg-amber-50 text-amber-700' },
    { title: t('hr.stats.recentlyAdded'), value: stats.recentlyAdded, subtitle: t('hr.stats.recentlyAddedSubtitle'), icon: <Sparkles size={18} />, tone: 'bg-sky-50 text-sky-700' },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
            </div>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeStats;
