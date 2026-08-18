'use client';

import React from 'react';
import { TrendingDown, CheckCircle2, Clock } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';
import type { RecurringItem } from '@/types/recurring';

interface RecurringMetricsProps {
  monthlyTotal: number;
  items: RecurringItem[];
}

export default function RecurringMetrics({ monthlyTotal, items }: RecurringMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Aylık Sabit Taahhüt"
        value={`₺${monthlyTotal.toLocaleString('tr-TR')}`}
        icon={TrendingDown}
      />
      <MetricCard
        label="Aktif Abonelik"
        value={`${items.filter((i) => i.isActive).length} kayıt`}
        icon={CheckCircle2}
        iconClassName="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="Yaklaşan Ödeme"
        value={
          items.length > 0
            ? new Date(items[0].nextDueDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
            : '-'
        }
        icon={Clock}
        iconClassName="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
      />
    </div>
  );
}
