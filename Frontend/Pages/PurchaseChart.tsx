import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../i18n';

interface PurchaseChartData {
  key: string;
  purchases: number;
}

interface PurchaseChartProps {
  data: PurchaseChartData[];
}

const PurchaseChart: React.FC<PurchaseChartProps> = ({ data }) => {
  const { t } = useI18n();

  const translatedData = data.map(item => ({
    ...item,
    name: item.key, // Assuming key is the date string
    [t('purchaseAnalysis.chartPurchasesLabel')]: item.purchases
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart
                data={translatedData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid #ddd',
                        borderRadius: '0.5rem',
                    }}
                />
                <Legend />
                <Bar dataKey={t('purchaseAnalysis.chartPurchasesLabel')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default PurchaseChart;