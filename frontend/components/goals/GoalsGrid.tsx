'use client';

import React from 'react';
import { PiggyBank, Award, Trash2, Clock, DollarSign, Sparkles } from 'lucide-react';
import type { GoalItem } from '@/types/goal';

interface GoalsGridProps {
  goals: GoalItem[];
  loading: boolean;
  projectingGoalId: string | null;
  onDelete: (id: string) => void;
  onDeposit: (goal: GoalItem) => void;
  onAiProjection: (goal: GoalItem) => void;
}

export default function GoalsGrid({ goals, loading, projectingGoalId, onDelete, onDeposit, onAiProjection }: GoalsGridProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
        <PiggyBank className="w-[18px] h-[18px] text-[var(--primary)]" />
        Hedef Kartlarınız
      </h2>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Hedefler yükleniyor...</div>
      ) : goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 text-sm space-y-3 border border-slate-200 dark:border-slate-700">
          <Award className="w-12 h-12 mx-auto opacity-30 text-[var(--primary)]" />
          <p>Henüz tanımlanmış bir finansal hedefiniz bulunmuyor.</p>
          <p className="text-xs text-slate-400">Yukarıdaki "Yeni Hedef Oluştur" butonuna tıklayarak ilk birikim hedefinizi belirleyebilirsiniz!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.status === 'COMPLETED' || percent >= 100;

            return (
              <div key={goal.id} className="glass-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[14.5px] text-slate-900 dark:text-white mb-1">{goal.title}</h3>
                    <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                      {goal.category}
                    </span>
                  </div>

                  <button
                    onClick={() => onDelete(goal.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">İlerleme</span>
                    <span className={isCompleted ? 'text-emerald-600' : 'text-[var(--primary)]'}>%{percent}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10.5px] text-slate-400 uppercase font-bold block mb-0.5">Biriken</span>
                    <span className="text-[17px] font-bold text-emerald-600">₺{goal.currentAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] text-slate-400 uppercase font-bold block mb-0.5">Hedef</span>
                    <span className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">₺{goal.targetAmount.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hedef tarihi: {new Date(goal.deadline).toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onDeposit(goal)}
                    disabled={isCompleted}
                    className="flex-1 btn-gradient py-2.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Para Ekle</span>
                  </button>

                  <button
                    onClick={() => onAiProjection(goal)}
                    disabled={projectingGoalId === goal.id}
                    className="bg-[var(--accent-soft)] text-[var(--primary)] p-2.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center"
                    title="Gemini AI Tahmin Motoru"
                  >
                    {projectingGoalId === goal.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
