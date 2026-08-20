'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import PublicLayout from '../../components/PublicLayout';
import { Sun, Moon } from 'lucide-react';

export default function ContactPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('finai_user'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSent(false), 4000);
  };

  const contactInfo = [
    { icon: Mail, label: 'E-posta', value: 'finai.supportdesk@gmail.com' },
  ];

  const content = (
    <>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Contact Info */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700 h-fit">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <MessageCircle className="w-4 h-4 text-[var(--primary)]" />
            İletişim Bilgileri
          </h2>

          <div className="space-y-4">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--accent-soft)] text-[var(--primary)]">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.label}</p>
                    <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white truncate">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed pt-4">
              Genellikle 1-2 iş günü içinde geri dönüş yapıyoruz. Acil durumlar için doğrudan e-posta göndermenizi öneririz.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <Send className="w-4 h-4 text-[var(--primary)]" />
            Mesaj Gönder
          </h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--success-soft)] text-[var(--success)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Mesajınız alındı!</p>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">En kısa sürede size geri döneceğiz.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Adınız Soyadınız
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ör. Ahmet Yılmaz"
                    className="input-light w-full rounded-lg px-3.5 py-2.5 text-[13.5px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[12.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    E-posta Adresiniz
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="input-light w-full rounded-lg px-3.5 py-2.5 text-[13.5px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[12.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Mesajınız
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bize iletmek istediğiniz konuyu yazın..."
                  rows={5}
                  className="input-light w-full rounded-lg px-3.5 py-2.5 text-[13.5px] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-gradient w-full rounded-lg py-2.5 text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-[15px] h-[15px]" />
                Gönder
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );

  if (!isLoggedIn) {
    return (
      <PublicLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">İletişim</h1>
          <p className={`text-[15px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın.
          </p>
        </div>
        {content}
      </PublicLayout>
    );
  }

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-[var(--primary)] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">
              İletişim
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın.
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title={isDarkMode ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {content}
    </AppLayout>
  );
}
