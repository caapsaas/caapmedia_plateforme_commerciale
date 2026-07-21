import React, { useMemo } from 'react';
import { Employee, EmployeeStatus } from '../../types';
import StatCard from '../ui/StatCard';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title={t('hr.stats.totalEmployees')}
        value={stats.total}
        subtitle={t('hr.stats.totalEmployeesSubtitle')}
        color="lime"
        icon={<Users size={24} />}
      />
      <StatCard
        title={t('hr.stats.active')}
        value={stats.active}
        subtitle={`${((stats.active / stats.total) * 100).toFixed(0)}% ${t('hr.stats.activeSubtitle')}`}
        color="green"
        icon={<CheckCircle size={24} />}
      />
      <StatCard
        title={t('hr.stats.onLeave')}
        value={stats.onLeave}
        subtitle={t('hr.stats.onLeaveSubtitle')}
        color="orange"
        icon={<Umbrella size={24} />}
      />
      <StatCard
        title={t('hr.stats.recentlyAdded')}
        value={stats.recentlyAdded}
        subtitle={t('hr.stats.recentlyAddedSubtitle')}
        color="blue"
        icon={<Sparkles size={24} />}
      />
    </div>
  );
};

export default EmployeeStats;
