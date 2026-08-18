'use client';

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  type: 'error' | 'success';
  message: string;
}

export default function AlertBanner({ type, message }: AlertBannerProps) {
  const isError = type === 'error';

  return (
    <div
      className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
        isError
          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300'
          : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-300'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
