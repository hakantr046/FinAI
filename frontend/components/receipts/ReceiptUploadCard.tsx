'use client';

import React from 'react';
import { UploadCloud, Sparkles } from 'lucide-react';
import AlertBanner from '@/components/shared/AlertBanner';

interface ReceiptUploadCardProps {
  previewUrl: string | null;
  uploading: boolean;
  file: File | null;
  error: string | null;
  successMessage: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ReceiptUploadCard({
  previewUrl,
  uploading,
  file,
  error,
  successMessage,
  onFileSelect,
  onSubmit,
}: ReceiptUploadCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
        <UploadCloud className="w-[18px] h-[18px] text-[var(--primary)]" />
        Fiş / Fatura Görseli Yükle
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="border-[1.5px] border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors bg-slate-50 dark:bg-slate-800/60 relative">
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Fiş Önizleme"
                className="max-h-64 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Farklı bir görsel seçmek için üzerine tıklayın
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 py-4">
              <UploadCloud className="w-[26px] h-[26px] text-[var(--primary)] mx-auto" />
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-200">
                  Görsel seçmek için tıklayın veya sürükleyin
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP desteklenir</p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full btn-gradient py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Gemini Vision ile Çözümle</span>
            </>
          )}
        </button>
      </form>

      {error && <AlertBanner type="error" message={error} />}
      {successMessage && <AlertBanner type="success" message={successMessage} />}
    </div>
  );
}
