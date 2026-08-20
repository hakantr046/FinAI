'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import AppLayout from '@/components/AppLayout';
import { useSession } from '@/hooks/useSession';
import { useTransactions } from '@/hooks/useTransactions';
import { useCsvImport } from '@/hooks/useCsvImport';
import { useBudgets } from '@/hooks/useBudgets';
import { useAdvisorChat } from '@/hooks/useAdvisorChat';
import { exportReport } from '@/lib/services/transactionService';
import DashboardToolbar from '@/components/dashboard/DashboardToolbar';
import BudgetAlerts from '@/components/dashboard/BudgetAlerts';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import TransactionInputPanel from '@/components/dashboard/TransactionInputPanel';
import BudgetPanel from '@/components/dashboard/BudgetPanel';
import CategoryCharts from '@/components/dashboard/CategoryCharts';
import TransactionsTable from '@/components/dashboard/TransactionsTable';
import EditTransactionModal from '@/components/dashboard/EditTransactionModal';
import ChatWidget from '@/components/shared/ChatWidget';

export default function Home() {
  const { isDarkMode } = useTheme();
  const { user, isReady } = useSession();
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');

  const budgetsApi = useBudgets();
  const txApi = useTransactions((userId) => budgetsApi.fetchBudgets(userId));
  const csvApi = useCsvImport((userId) => {
    txApi.fetchTransactions(userId);
    budgetsApi.fetchBudgets(userId);
  });
  const chatApi = useAdvisorChat(
    user?.id,
    () => JSON.stringify(budgetsApi.budgets.map((b) => ({ category: b.category, limitAmount: b.limitAmount, currentSpent: b.currentSpent, percentage: b.percentage }))),
    'Merhaba! Ben FinAI Finansal Asistanınız. Bütçeniz veya harcamalarınız hakkında benden öneri almak ister misiniz?'
  );

  useEffect(() => {
    if (!user) return;
    txApi.fetchTransactions(user.id);
    budgetsApi.fetchBudgets(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!user) return;
    exportReport(user.id, format, txApi.dateRange).catch((err) => {
      console.error(err);
      alert(err.message || 'Rapor indirilirken bir hata oluştu.');
    });
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-medium">Yönlendiriliyor...</span>
        </div>
      </div>
    );
  }

  const totalExpense = txApi.transactions.reduce((acc, curr) => acc + (Number(curr.parsedData?.amount) || 0), 0);

  const categoryData = Object.values(
    txApi.transactions.reduce((acc: Record<string, { name: string; value: number }>, curr) => {
      const cat = curr.parsedData?.category || 'Diğer';
      const amt = Number(curr.parsedData?.amount) || 0;
      if (!acc[cat]) {
        acc[cat] = { name: cat, value: 0 };
      }
      acc[cat].value += amt;
      return acc;
    }, {})
  );

  return (
    <AppLayout>
      <div className="space-y-5 select-none">
        <DashboardToolbar
          userName={user.name}
          dateRange={txApi.dateRange}
          onRangeChange={(range) => txApi.handleRangeChange(range, user.id)}
          onExport={handleExport}
        />

        <BudgetAlerts budgets={budgetsApi.budgets} />

        <MetricsGrid
          txLoading={txApi.txLoading}
          transactions={txApi.transactions}
          totalExpense={totalExpense}
          budgets={budgetsApi.budgets}
        />

        <TransactionInputPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          singleFormProps={{
            inputText: txApi.inputText,
            onInputTextChange: txApi.setInputText,
            onSubmit: (e) => txApi.handleSubmit(e, user.id),
            loading: txApi.loading,
            error: txApi.error,
          }}
          csvFormProps={{
            csvFile: csvApi.csvFile,
            onCsvFileChange: csvApi.setCsvFile,
            csvDateCol: csvApi.csvDateCol,
            onCsvDateColChange: csvApi.setCsvDateCol,
            csvDescCol: csvApi.csvDescCol,
            onCsvDescColChange: csvApi.setCsvDescCol,
            csvAmtCol: csvApi.csvAmtCol,
            onCsvAmtColChange: csvApi.setCsvAmtCol,
            csvLoading: csvApi.csvLoading,
            csvSuccessMessage: csvApi.csvSuccessMessage,
            csvErrorMessage: csvApi.csvErrorMessage,
            onSubmit: (e) => csvApi.handleCsvSubmit(e, user.id),
          }}
        />

        <BudgetPanel
          budgets={budgetsApi.budgets}
          budgetLoading={budgetsApi.budgetLoading}
          onDeleteBudget={(budgetId) => budgetsApi.handleBudgetDelete(budgetId, user.id)}
          budgetCategory={budgetsApi.budgetCategory}
          onBudgetCategoryChange={budgetsApi.setBudgetCategory}
          budgetLimitAmount={budgetsApi.budgetLimitAmount}
          onBudgetLimitAmountChange={budgetsApi.setBudgetLimitAmount}
          budgetSubmitLoading={budgetsApi.budgetSubmitLoading}
          onBudgetSubmit={(e) => budgetsApi.handleBudgetSubmit(e, user.id)}
        />

        {txApi.transactions.length > 0 && (
          <CategoryCharts categoryData={categoryData} isDarkMode={isDarkMode} />
        )}

        <TransactionsTable
          transactions={txApi.transactions}
          txLoading={txApi.txLoading}
          onEdit={txApi.handleStartEdit}
          onDelete={(id) => txApi.handleDeleteTransaction(id, user.id)}
        />

        {txApi.editingTx && (
          <EditTransactionModal
            onClose={() => txApi.setEditingTx(null)}
            onSubmit={(e) => txApi.handleUpdateTransaction(e, user.id)}
            editAmount={txApi.editAmount}
            onEditAmountChange={txApi.setEditAmount}
            editIntent={txApi.editIntent}
            onEditIntentChange={txApi.setEditIntent}
            editCategory={txApi.editCategory}
            onEditCategoryChange={txApi.setEditCategory}
            editMerchant={txApi.editMerchant}
            onEditMerchantChange={txApi.setEditMerchant}
            editDate={txApi.editDate}
            onEditDateChange={txApi.setEditDate}
            editLoading={txApi.editLoading}
          />
        )}

        {false && (
          <ChatWidget
            isOpen={chatApi.isChatOpen}
            onToggle={chatApi.setIsChatOpen}
            history={chatApi.chatHistory}
            message={chatApi.chatMessage}
            onMessageChange={chatApi.setChatMessage}
            onSubmit={chatApi.handleSendChatMessage}
            loading={chatApi.chatLoading}
          />
        )}
      </div>
    </AppLayout>
  );
}
