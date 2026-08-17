'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Repeat, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Zap,
  TrendingDown
} from 'lucide-react';
import { fetchWithAuth, logout } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { Sun, Moon } from 'lucide-react';

interface RecurringItem {
  id: string;
  merchantName: string;
  amount: number;
  category: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function RecurringPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual Creation Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Eğlence');
  const [frequency, setFrequency] = useState('Monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchRecurringItems(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  const fetchRecurringItems = (userId: string) => {
    setLoading(true);
    fetchWithAuth(`/api/recurring-transactions/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          setMonthlyTotal(data.monthlyTotal || 0);
        }
      })
      .catch((err) => console.error('Abonelikler çekilemedi:', err))
      .finally(() => setLoading(false));
  };

  const handleDetectSubscriptions = async () => {
    if (!user) return;
    setDetecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchWithAuth('/api/recurring-transactions/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Abonelikler tespit edilemedi.');
      }

      setSuccessMessage(data.message || 'Abonelikler başarıyla analiz edildi!');
      fetchRecurringItems(user.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Yapay zeka tespiti sırasında hata oluştu.');
    } finally {
      setDetecting(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !merchantName || !amount) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/recurring-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          merchantName,
          amount: parseFloat(amount),
          category,
          frequency,
          nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : new Date().toISOString(),
          isActive: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Abonelik kaydedilemedi.');
      }

      setIsModalOpen(false);
      setMerchantName('');
      setAmount('');
      fetchRecurringItems(user.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kaydetme hatası.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user || !confirm('Bu abonelik kaydını silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithAuth(`/api/recurring-transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kayıt silinemedi.');
      }

      fetchRecurringItems(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Silme hatası oluştu.');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'Monthly': return 'Aylık';
      case 'Weekly': return 'Haftalık';
      case 'Yearly': return 'Yıllık';
      default: return freq;
    }
  };

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
              Abonelikler & Tekrarlayan Giderler
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Düzenli ödemelerinizi otomatik tespit edin ve tek yerden yönetin.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={handleDetectSubscriptions}
            disabled={detecting}
            className="btn-gradient px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {detecting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka ile Tara</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[var(--primary)]" />
            <span>Yeni Abonelik Ekle</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aylık Sabit Taahhüt</span>
            <div className="bg-[var(--accent-soft)] text-[var(--primary)] w-9 h-9 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[26px] font-bold text-slate-900 dark:text-white">₺{monthlyTotal.toLocaleString('tr-TR')}</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aktif Abonelik</span>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-9 h-9 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[26px] font-bold text-slate-900 dark:text-white">{items.filter(i => i.isActive).length} kayıt</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Yaklaşan Ödeme</span>
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 w-9 h-9 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[26px] font-bold text-slate-900 dark:text-white">
            {items.length > 0 ? new Date(items[0].nextDueDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '-'}
          </div>
        </div>
      </div>

      {/* Subscriptions Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Repeat className="w-[18px] h-[18px] text-[var(--primary)]" />
          Aktif Abonelikleriniz
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-16 text-slate-400 dark:text-slate-500 text-sm space-y-3">
            <Zap className="w-12 h-12 mx-auto opacity-30 text-[var(--primary)]" />
            <p>Henüz kayıtlı tekrarlayan bir ödemeniz bulunmamaktadır.</p>
            <p className="text-xs text-slate-400">"Yapay Zeka ile Tara" butonuna tıklayarak geçmiş işlemlerinizden otomatik tespit yaptırabilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[14.5px] text-slate-900 dark:text-white mb-1">{item.merchantName}</h3>
                    <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 block font-bold mb-0.5">Tutar</span>
                    <span className="text-[17px] font-bold text-slate-900 dark:text-white">₺{item.amount.toLocaleString('tr-TR')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 block font-bold mb-0.5">Periyot</span>
                    <span className="text-[12.5px] font-semibold text-[var(--primary)]">{getFrequencyLabel(item.frequency)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sonraki ödeme: {new Date(item.nextDueDate).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Plus className="w-5 h-5 text-indigo-500" />
              Yeni Abonelik / Düzenli Ödeme Ekle
            </h3>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hizmet / Firma Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Netflix, Turkcell Fatura, Ev Kirası"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Tutar (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="250"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Periyot</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="Monthly">Aylık</option>
                    <option value="Weekly">Haftalık</option>
                    <option value="Yearly">Yıllık</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <option value="Eğlence">Eğlence</option>
                    <option value="Fatura">Fatura</option>
                    <option value="Gıda/Market">Gıda/Market</option>
                    <option value="Ulaşım">Ulaşım</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Sonraki Ödeme Tarihi</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Aboneliği Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
