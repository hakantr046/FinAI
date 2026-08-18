'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';
import ReceiptUploadCard from '@/components/receipts/ReceiptUploadCard';
import ReceiptResultCard from '@/components/receipts/ReceiptResultCard';
import ReceiptHistoryTable from '@/components/receipts/ReceiptHistoryTable';
import { useSession } from '@/hooks/useSession';
import { useReceipts } from '@/hooks/useReceipts';

export default function ReceiptsPage() {
  const { user } = useSession();
  const {
    file,
    previewUrl,
    uploading,
    error,
    successMessage,
    parsedResult,
    editMerchant,
    setEditMerchant,
    editAmount,
    setEditAmount,
    editCategory,
    setEditCategory,
    editDate,
    setEditDate,
    confirming,
    history,
    historyLoading,
    itemsList,
    handleFileSelect,
    handleUploadSubmit,
    handleConfirmReceipt,
  } = useReceipts(user?.id);

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
              Fiş & Fatura Tarama
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Fiş görsellerinizi yükleyin, yapay zeka otomatik olarak harcamalarınıza dönüştürsün.
            </p>
          </div>
        </div>

        <ThemeToggleButton variant="sm" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReceiptUploadCard
          previewUrl={previewUrl}
          uploading={uploading}
          file={file}
          error={error}
          successMessage={successMessage}
          onFileSelect={handleFileSelect}
          onSubmit={handleUploadSubmit}
        />

        <ReceiptResultCard
          parsedResult={parsedResult}
          itemsList={itemsList}
          editMerchant={editMerchant}
          onEditMerchantChange={setEditMerchant}
          editAmount={editAmount}
          onEditAmountChange={setEditAmount}
          editCategory={editCategory}
          onEditCategoryChange={setEditCategory}
          editDate={editDate}
          onEditDateChange={setEditDate}
          confirming={confirming}
          onConfirm={handleConfirmReceipt}
        />
      </div>

      <ReceiptHistoryTable history={history} loading={historyLoading} />
    </AppLayout>
  );
}
