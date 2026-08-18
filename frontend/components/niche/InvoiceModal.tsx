'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { VAT_RATES } from '@/lib/constants';

interface InvoiceModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  invAmount: string;
  onInvAmountChange: (value: string) => void;
  invVatRate: number;
  onInvVatRateChange: (value: number) => void;
  invDescription: string;
  onInvDescriptionChange: (value: string) => void;
  submittingInvoice: boolean;
}

export default function InvoiceModal({
  onClose,
  onSubmit,
  clientName,
  onClientNameChange,
  invAmount,
  onInvAmountChange,
  invVatRate,
  onInvVatRateChange,
  invDescription,
  onInvDescriptionChange,
  submittingInvoice,
}: InvoiceModalProps) {
  return (
    <Modal onClose={onClose} title="Yeni Fatura Kaydı Oluştur" icon={FileText}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Müşteri / Firma Adı</label>
          <input
            type="text"
            required
            placeholder="Örn: ABC Teknoloji A.Ş."
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Matrah (KDV Hariç ₺)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="10000"
              value={invAmount}
              onChange={(e) => onInvAmountChange(e.target.value)}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">KDV Oranı</label>
            <select
              value={invVatRate}
              onChange={(e) => onInvVatRateChange(parseInt(e.target.value))}
              className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
            >
              {[...VAT_RATES].sort((a, b) => b - a).map((rate) => (
                <option key={rate} value={rate}>%{rate}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Açıklama / Ürün</label>
          <input
            type="text"
            placeholder="Yazılım Danışmanlık Hizmeti"
            value={invDescription}
            onChange={(e) => onInvDescriptionChange(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submittingInvoice}
            className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
          >
            {submittingInvoice ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
