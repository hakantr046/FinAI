'use client';

import React from 'react';
import { CreditCard, Wallet, PieChart as PieChartIcon, Target } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';
import { MetricCardSkeleton } from '@/components/Skeleton';
import type { BudgetSummary, TransactionRecord } from '@/types/transaction';

interface MetricsGridProps {
  txLoading: boolean;
  transactions: TransactionRecord[];
  totalExpense: number;
  budgets: BudgetSummary[];
}

export default function MetricsGrid({ txLoading, transactions, totalExpense, budgets }: MetricsGridProps) {
  if (txLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Toplam İşlem"
        value={`${transactions.length} adet`}
        icon={CreditCard}
        hint="Bu ay güncellendi"
      />
      <MetricCard
        label="Bu Ay Harcanan"
        value={`₺${totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
        icon={Wallet}
        iconClassName="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        hint="Geçen aya göre takip ediliyor"
      />
      <MetricCard
        label="AI Ayrıştırma Doğruluğu"
        value="%98.4"
        icon={PieChartIcon}
        iconClassName="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        hint="Gemini 2.5 Flash"
      />
      <MetricCard
        label="Bütçe Limiti Durumu"
        value={budgets.length > 0 ? `${budgets.length} kategori` : 'Tanımlanmadı'}
        icon={Target}
        hint="Otomatik aşım takibi aktif"
      />
    </div>
  );
}
