'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Users, Building, ArrowLeft } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useInvoices } from '@/hooks/useInvoices';
import AppLayout from '@/components/AppLayout';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';
import VatCalculatorCard from '@/components/niche/VatCalculatorCard';
import InvoiceLogCard from '@/components/niche/InvoiceLogCard';
import InvoiceModal from '@/components/niche/InvoiceModal';
import FamilyBudgetSplitter from '@/components/niche/FamilyBudgetSplitter';

export default function NichePage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<'esnaf' | 'family'>('esnaf');

  const {
    invoices,
    totalVatSum,
    totalInvoiceSum,
    loadingInvoices,
    fetchInvoices,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    clientName,
    setClientName,
    invAmount,
    setInvAmount,
    invVatRate,
    setInvVatRate,
    invDescription,
    setInvDescription,
    submittingInvoice,
    handleCreateInvoice,
    handleDeleteInvoice,
  } = useInvoices(user?.id);

  useEffect(() => {
    if (user) fetchInvoices(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Niş Finans Paketi (Esnaf & Aile Bütçesi)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Esnaf / serbest meslek KDV ve fatura takibi, Aile & Ortak ev harcaması bölüştürücü
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggleButton variant="lg" />

          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('esnaf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'esnaf'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Esnaf & KDV Modülü</span>
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'family'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Aile & Ortak Bütçe</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'esnaf' ? (
        <div className="space-y-6 animate-fade-in">
          <VatCalculatorCard />
          <InvoiceLogCard
            invoices={invoices}
            totalInvoiceSum={totalInvoiceSum}
            totalVatSum={totalVatSum}
            loadingInvoices={loadingInvoices}
            onAddInvoice={() => setIsInvoiceModalOpen(true)}
            onDeleteInvoice={handleDeleteInvoice}
          />
        </div>
      ) : (
        <FamilyBudgetSplitter />
      )}

      {isInvoiceModalOpen && (
        <InvoiceModal
          onClose={() => setIsInvoiceModalOpen(false)}
          onSubmit={handleCreateInvoice}
          clientName={clientName}
          onClientNameChange={setClientName}
          invAmount={invAmount}
          onInvAmountChange={setInvAmount}
          invVatRate={invVatRate}
          onInvVatRateChange={setInvVatRate}
          invDescription={invDescription}
          onInvDescriptionChange={setInvDescription}
          submittingInvoice={submittingInvoice}
        />
      )}
    </AppLayout>
  );
}
