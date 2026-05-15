import React, { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StockChartData } from '../types';
import { useI18n } from '../i18n';

interface StockChartProps {
  data: StockChartData[];
}

const COLORS = ['#c6e911', '#231F20', '#6B7280', '#FBBF24', '#38BDF8', '#8B5CF6'];

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const translatedData = data.map(item => ({
    ...item,
    name: t(item.nameKey),
  }));

  // Calculer outerRadius en fonction de la taille du conteneur
  const outerRadius = Math.min(dimensions.width, dimensions.height) * 0.1;

  return (
    <div ref={containerRef} className="w-full test-xs h-full min-h-[300px]">
      {dimensions.width > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={translatedData}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
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
      )}
    </div>
  );
};


export default StockChart;