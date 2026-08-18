'use client';

import React from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/types/invoice';

interface InvoiceLogCardProps {
  invoices: InvoiceItem[];
  totalInvoiceSum: number;
  totalVatSum: number;
  loadingInvoices: boolean;
  onAddInvoice: () => void;
  onDeleteInvoice: (id: string) => void;
}

export default function InvoiceLogCard({
  invoices,
  totalInvoiceSum,
  totalVatSum,
  loadingInvoices,
  onAddInvoice,
  onDeleteInvoice,
}: InvoiceLogCardProps) {
  return (
    <div className="glass-card rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Kesilen Fatura Takibi & KDV Raporu
        </h2>

        <button
          onClick={onAddInvoice}
          className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Fatura Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase block">Toplam Ciro (KDV Dahil)</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">₺{totalInvoiceSum.toLocaleString('tr-TR')}</span>
        </div>
        <div className="p-4 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase block">Biriken Toplam KDV</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₺{totalVatSum.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="p-4">Müşteri / Firma</th>
              <th className="p-4">Matrah</th>
              <th className="p-4">KDV Oranı</th>
              <th className="p-4">KDV Tutarı</th>
              <th className="p-4">Toplam Tutar</th>
              <th className="p-4 text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {loadingInvoices ? (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-xs">Yükleniyor...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-xs">Henüz kesilen fatura kaydı bulunmuyor.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="table-row-hover">
                  <td className="p-4 font-semibold text-slate-800 dark:text-white">{inv.clientName}</td>
                  <td className="p-4 font-mono text-xs">₺{inv.amountBeforeVat.toLocaleString('tr-TR')}</td>
                  <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">%{inv.vatRatePercent}</span></td>
                  <td className="p-4 font-semibold text-indigo-600">₺{inv.vatAmount.toLocaleString('tr-TR')}</td>
                  <td className="p-4 font-bold text-emerald-600">₺{inv.totalAmount.toLocaleString('tr-TR')}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
