'use client';

import React from 'react';
import { TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import PublicLayout from '../../components/PublicLayout';

export default function AboutPage() {
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: TrendingUp,
      title: 'Akıllı Harcama & Fiş Ayrıştırma',
      desc: 'Doğal dil ve fiş görsellerini saniyeler içinde kategorize eder, harcamalarınızı otomatik olarak işler.',
    },
    {
      icon: Shield,
      title: 'Gelişmiş Veri Gizliliği',
      desc: 'Kimlik, IBAN ve kart bilgileriniz oturum bazlı olarak maskelenir, verileriniz güvende kalır.',
    },
    {
      icon: Zap,
      title: 'Anomali & Bütçe Uyarıları',
      desc: 'Bütçe aşımları ve alışılmadık harcamalar için yapay zeka destekli anında bildirim alırsınız.',
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-2xl mb-10">
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase mb-4 ${
          isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Yapay Zeka Destekli Bütçe Yönetimi</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Hakkımızda</h1>
        <p className={`text-[15px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          FinAI, bireylerin ve küçük işletmelerin finansal hayatını yapay zekayla kolaylaştırmak için kuruldu.
          Fişlerinizi taramaktan bütçe takibine, tekrarlayan ödemeleri tespit etmekten finansal hedeflerinize
          ulaşmanıza kadar tüm süreci tek bir panelde topluyoruz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`rounded-2xl p-5 border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-[var(--accent-soft)] text-[var(--primary)]">
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <h3 className="font-semibold text-[14px] mb-1.5">{f.title}</h3>
              <p className={`text-[13px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className={`rounded-2xl p-6 border flex flex-wrap items-center gap-3 text-[13px] ${
        isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
      }`}>
        <span>%97.8 AI Doğruluk</span>
        <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>|</span>
        <span>Uçtan Uca Veri Gizliliği</span>
        <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>|</span>
        <span>7/24 Finans Danışmanı</span>
      </div>
    </PublicLayout>
  );
}
