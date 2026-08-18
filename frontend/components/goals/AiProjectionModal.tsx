'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import type { GoalAiProjection } from '@/types/goal';

interface AiProjectionModalProps {
  projection: GoalAiProjection;
  onClose: () => void;
}

export default function AiProjectionModal({ projection, onClose }: AiProjectionModalProps) {
  return (
    <Modal onClose={onClose} title="Gemini AI Hedef Tahmin Raporu" icon={Sparkles} maxWidth="lg">
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-2">
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">Tahmini Tamamlanma Tarihi</span>
          <span className="text-xl font-bold text-slate-800 dark:text-white">{projection.estimatedCompletionDate}</span>
        </div>

        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl space-y-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">Tavsiye Edilen Aylık Tasarruf</span>
          <span className="text-xl font-bold text-emerald-600">₺{projection.recommendedMonthlySaving?.toLocaleString('tr-TR')} / ay</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>Yapay Zeka Önerisi:</strong> {projection.adviceText}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full btn-gradient py-2.5 rounded-xl font-semibold text-xs cursor-pointer mt-2"
      >
        Tamam
      </button>
    </Modal>
  );
}
