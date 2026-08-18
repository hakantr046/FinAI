'use client';

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { calculateFamilySplit, type FamilySplitShare } from '@/lib/familySplit';

export default function FamilyBudgetSplitter() {
  const [billTitle, setBillTitle] = useState('Ev Kirası & Faturalar');
  const [totalBill, setTotalBill] = useState('15000');
  const [members, setMembers] = useState<string>('Ahmet, Ayşe, Mehmet');
  const [splitResult, setSplitResult] = useState<FamilySplitShare[]>([]);

  const handleCalculateFamilySplit = () => {
    setSplitResult(calculateFamilySplit(parseFloat(totalBill) || 0, members));
  };

  return (
    <div className="glass-card rounded-3xl p-6 space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Users className="w-5 h-5 text-indigo-500" />
        Aile & Ortak Ev Harcaması Bölüştürücü
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Harcama/Fatura Başlığı</label>
            <input
              type="text"
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Toplam Ödenen Tutar (₺)</label>
            <input
              type="number"
              value={totalBill}
              onChange={(e) => setTotalBill(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Ortaklar / Aile Bireyleri (Virgülle Ayırın)</label>
            <input
              type="text"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="Ahmet, Ayşe, Mehmet"
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <button
            onClick={handleCalculateFamilySplit}
            className="w-full btn-gradient py-3 rounded-xl font-semibold text-xs cursor-pointer"
          >
            Kişi Başı Düşen Payı Hesapla
          </button>
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bölüşüm Sonuçları</span>

          {splitResult.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              Sol taraftaki bilgileri doldurup "Hesapla" butonuna basarak bütçe paylaşımını görün.
            </div>
          ) : (
            <div className="space-y-3">
              {splitResult.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{res.name}</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Ödemesi Gereken Pay</span>
                    <span className="font-bold text-indigo-600 text-base">₺{res.share.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
