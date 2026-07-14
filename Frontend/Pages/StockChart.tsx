import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StockChartData } from '../types';
import { useI18n } from '../i18n';

interface StockChartProps {
  data: StockChartData[];
}

const COLORS = ['#c6e911', '#231F20', '#6B7280', '#FBBF24', '#38BDF8', '#8B5CF6'];

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const { t } = useI18n();

  const translatedData = data.map(item => ({
    ...item,
    name: t(item.nameKey),
  }));

  return (
    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={translatedData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            nameKey="name"
            labelLine={false}
          >
            {translatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
