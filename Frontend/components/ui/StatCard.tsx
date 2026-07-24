import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'lime' | 'blue' | 'green' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorStyles = {
  lime: 'from-[#c6e911]/20 to-[#c6e911]/5 text-[#7a8e00]',
  blue: 'from-blue-100 to-blue-50 text-blue-700',
  green: 'from-green-100 to-green-50 text-green-700',
  orange: 'from-orange-100 to-orange-50 text-orange-700',
  red: 'from-red-100 to-red-50 text-red-700',
};

const iconBgColors = {
  lime: 'bg-[#c6e911]/30',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  orange: 'bg-orange-200',
  red: 'bg-red-200',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'lime',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br ${colorStyles[color]}
        rounded-lg p-6 border border-slate-200
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`text-sm font-semibold mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${iconBgColors[color]} rounded-lg p-3`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
