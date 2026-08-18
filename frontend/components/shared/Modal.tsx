'use client';

import React from 'react';
import { X, type LucideIcon } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  maxWidth?: 'md' | 'lg';
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export default function Modal({ onClose, title, icon: Icon, maxWidth = 'md', showCloseButton = false, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 w-full ${maxWidth === 'lg' ? 'max-w-lg' : 'max-w-md'} shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700`}>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
