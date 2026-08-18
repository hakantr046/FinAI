'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

const COLORS = ['#3454a0', '#2f9e8f', '#3ea34a', '#c98a2a', '#c14848', '#9257b0'];

interface CategoryChartsProps {
  categoryData: { name: string; value: number }[];
  isDarkMode: boolean;
}

export default function CategoryCharts({ categoryData, isDarkMode }: CategoryChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
          <PieChartIcon className="w-[18px] h-[18px] text-[var(--primary)]" />
          <span>Kategoriye Göre Dağılım</span>
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={5}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  color: isDarkMode ? '#f8fafc' : '#1e293b',
                }}
                itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#1e293b', fontWeight: 600 }}
                formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Toplam Tutar']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
          <BarChart3 className="w-[18px] h-[18px] text-[var(--primary)]" />
          <span>Kategori Bazlı Toplamlar</span>
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <XAxis dataKey="name" stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
              <YAxis stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                itemStyle={{ color: '#3454a0', fontWeight: 700 }}
                formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Tutar']}
              />
              <Bar dataKey="value" fill="#3454a0" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
