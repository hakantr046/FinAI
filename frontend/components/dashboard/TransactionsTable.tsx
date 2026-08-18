'use client';

import React from 'react';
import { CheckCircle2, Edit2, Receipt as ReceiptIcon, Trash2 } from 'lucide-react';
import { TableRowSkeleton } from '@/components/Skeleton';
import type { TransactionRecord } from '@/types/transaction';

interface TransactionsTableProps {
  transactions: TransactionRecord[];
  txLoading: boolean;
  onEdit: (tx: TransactionRecord) => void;
  onDelete: (id: string) => void;
}

export default function TransactionsTable({ transactions, txLoading, onEdit, onDelete }: TransactionsTableProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ReceiptIcon className="w-[18px] h-[18px] text-[var(--primary)]" />
          <span>Son İşlemler</span>
        </h2>
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {transactions.length} kayıt
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="p-4 pl-6 border-b border-slate-200 dark:border-slate-700">İşlem ID</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">İşyeri / Başlık</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Kategori</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tutar</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tarih</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700">Durum</th>
              <th className="p-4 pr-6 text-right border-b border-slate-200 dark:border-slate-700">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {txLoading ? (
              <>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                  Henüz işlenmiş bir harcama kaydı bulunmuyor. Yukarıdaki yapay zeka alanından ilk harcamanızı anında ekleyebilirsiniz!
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6 border-t border-slate-100 dark:border-slate-800 font-mono text-[11.5px] text-slate-400">{tx.transactionId?.substring(0, 8)}...</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">{tx.parsedData?.merchantOrTitle || 'Bilinmeyen'}</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                      {tx.parsedData?.category || 'Diğer'}
                    </span>
                  </td>
                  <td className={`p-4 border-t border-slate-100 dark:border-slate-800 font-bold text-[13.5px] ${tx.parsedData?.intent === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.parsedData?.intent === 'INCOME' ? '+' : '−'}₺{Number(tx.parsedData?.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-[12.5px] text-slate-500 dark:text-slate-400">{tx.parsedData?.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0]}</td>
                  <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> İşlendi
                    </span>
                  </td>
                  <td className="p-4 pr-6 border-t border-slate-100 dark:border-slate-800 text-right">
                    <div className="flex justify-end gap-1 items-center">
                      <button
                        onClick={() => onEdit(tx)}
                        className="text-slate-400 hover:text-[var(--primary)] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="İşlemi Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.transactionId)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="İşlemi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
