'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleButtonProps {
  variant?: 'sm' | 'lg';
}

export default function ThemeToggleButton({ variant = 'sm' }: ThemeToggleButtonProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses =
    variant === 'lg'
      ? 'p-2.5 rounded-xl'
      : 'w-9 h-9 rounded-lg';
  const iconClasses = variant === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses} bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm`}
      title={isDarkMode ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
    >
      {isDarkMode ? <Sun className={`${iconClasses} text-amber-400`} /> : <Moon className={`${iconClasses} text-slate-500`} />}
    </button>
  );
}
