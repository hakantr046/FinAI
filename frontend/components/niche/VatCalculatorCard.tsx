'use client';

import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { VAT_RATES } from '@/lib/constants';

export default function VatCalculatorCard() {
  const [baseAmount, setBaseAmount] = useState<string>('10000');
  const [vatRate, setVatRate] = useState<number>(20);
  const [calculatedVat, setCalculatedVat] = useState<number>(2000);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(12000);

  useEffect(() => {
    const amt = parseFloat(baseAmount) || 0;
    const vat = amt * (vatRate / 100);
    setCalculatedVat(vat);
    setCalculatedTotal(amt + vat);
  }, [baseAmount, vatRate]);

  return (
    <div className="glass-card rounded-3xl p-6 space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        KDV & Stopaj Hesaplayıcı (%1, %10, %20)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 block font-bold">Matrah / Net Tutar (₺)</label>
            <input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 block font-bold">KDV Oranı</label>
            <div className="grid grid-cols-3 gap-2">
              {VAT_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setVatRate(rate)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    vatRate === rate
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  %{rate}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1 shadow-sm">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold block">Hesaplanan KDV Tutarı</span>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₺{calculatedVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Devlete Ödenecek/İndirilecek KDV</span>
          </div>

          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1 shadow-sm">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">KDV Dahil Toplam Tutar</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Müşteriye Kesilecek Fatura Tutarı</span>
          </div>
        </div>
      </div>
    </div>
  );
}
