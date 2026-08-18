'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, ArrowLeft, Info, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-stone-50 text-slate-900'}`}>
      {/* Top Bar */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-stone-50/90 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/brand/finai-logo-icon.png" alt="FinAI" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[15px]">FinAI</span>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/about"
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Hakkımızda</span>
              </Link>
              <Link
                href="/contact"
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>İletişim</span>
              </Link>
            </nav>

            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title={isDarkMode ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            <Link
              href="/login"
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-blue-800 hover:bg-blue-900 text-white'
              }`}
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14">{children}</div>
    </div>
  );
}
