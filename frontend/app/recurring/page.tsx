'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Plus, ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';
import AlertBanner from '@/components/shared/AlertBanner';
import RecurringMetrics from '@/components/recurring/RecurringMetrics';
import RecurringGrid from '@/components/recurring/RecurringGrid';
import RecurringCreateModal from '@/components/recurring/RecurringCreateModal';
import { useSession } from '@/hooks/useSession';
import { useRecurringItems } from '@/hooks/useRecurringItems';

export default function RecurringPage() {
  const { user } = useSession();
  const recurring = useRecurringItems();

  React.useEffect(() => {
    if (user) {
      recurring.fetchRecurringItems(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-[var(--primary)] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">
              Abonelikler & Tekrarlayan Giderler
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Düzenli ödemelerinizi otomatik tespit edin ve tek yerden yönetin.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center">
          <ThemeToggleButton />

          <button
            onClick={() => recurring.handleDetectSubscriptions(user.id)}
            disabled={recurring.detecting}
            className="btn-gradient px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {recurring.detecting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka ile Tara</span>
              </>
            )}
          </button>

          <button
            onClick={() => recurring.setIsModalOpen(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[var(--primary)]" />
            <span>Yeni Abonelik Ekle</span>
          </button>
        </div>
      </div>

      {recurring.error && <AlertBanner type="error" message={recurring.error} />}
      {recurring.successMessage && <AlertBanner type="success" message={recurring.successMessage} />}

      <RecurringMetrics monthlyTotal={recurring.monthlyTotal} items={recurring.items} />

      <RecurringGrid
        items={recurring.items}
        loading={recurring.loading}
        onDelete={(id) => recurring.handleDeleteItem(id, user.id)}
      />

      {recurring.isModalOpen && (
        <RecurringCreateModal
          onClose={() => recurring.setIsModalOpen(false)}
          onSubmit={(e) => recurring.handleCreateSubscription(e, user.id)}
          merchantName={recurring.merchantName}
          onMerchantNameChange={recurring.setMerchantName}
          amount={recurring.amount}
          onAmountChange={recurring.setAmount}
          category={recurring.category}
          onCategoryChange={recurring.setCategory}
          frequency={recurring.frequency}
          onFrequencyChange={recurring.setFrequency}
          nextDueDate={recurring.nextDueDate}
          onNextDueDateChange={recurring.setNextDueDate}
          submitting={recurring.submitting}
        />
      )}
    </AppLayout>
  );
}
