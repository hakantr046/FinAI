'use client';

import React from 'react';
import { Users, CreditCard, Wallet, Percent } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';
import type { SystemStats } from '@/types/admin';

interface AdminStatsGridProps {
  stats: SystemStats | null;
}

export default function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        label="Toplam Kayıtlı Üye"
        value={stats?.totalUsers || 0}
        icon={Users}
        iconClassName="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
      />
      <MetricCard
        label="Toplam AI Çözümleme"
        value={stats?.totalTransactions || 0}
        icon={CreditCard}
        iconClassName="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="Toplam İşlenen Hacim"
        value={`₺${(stats?.totalVolume || 0).toLocaleString('tr-TR')}`}
        icon={Wallet}
        iconClassName="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
      />
      <MetricCard
        label="AI Doğruluk Ortalaması"
        value={`%${stats?.averageConfidenceScore || 0}`}
        icon={Percent}
        iconClassName="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
