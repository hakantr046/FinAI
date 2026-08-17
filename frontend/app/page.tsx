'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CreditCard, ArrowUpRight, Wallet, PieChart as PieChartIcon, CheckCircle2, AlertCircle, BarChart3, LogOut, AlertTriangle, Trash2, Plus, Percent, Edit2, LayoutDashboard, Shield, Calendar, FileSpreadsheet, FileText, Download, Sun, Moon, Receipt as ReceiptIcon, Repeat, Bell, Target, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { fetchWithAuth, logout } from '../lib/apiClient';
import { MetricCardSkeleton, TableRowSkeleton, BudgetSkeleton } from '../components/Skeleton';
import { useTheme } from '../context/ThemeContext';
import AppLayout from '../components/AppLayout';

interface ParsedTransaction {
  isSuccessful: boolean;
  intent: string;
  amount: number;
  category: string;
  merchantOrTitle: string;
  transactionDate: string;
  confidenceScore: number;
}

interface ApiResponse {
  transactionId: string;
  parsedData: ParsedTransaction;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  isAdmin: boolean;
}

interface BudgetSummary {
  budgetId: string;
  category: string;
  limitAmount: number;
  currentSpent: number;
  percentage: number;
}

const COLORS = ['#3454a0', '#2f9e8f', '#3ea34a', '#c98a2a', '#c14848', '#9257b0'];

export default function Home() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [transactions, setTransactions] = useState<ApiResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Bütçe Yönetimi State'leri
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [budgetCategory, setBudgetCategory] = useState('Gıda/Market');
  const [budgetLimitAmount, setBudgetLimitAmount] = useState('');
  const [budgetSubmitLoading, setBudgetSubmitLoading] = useState(false);

  // Tab ve CSV Import State'leri
  const [activeTab, setActiveTab] = useState<'single' | 'csv'>('single');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDateCol, setCsvDateCol] = useState('Tarih');
  const [csvDescCol, setCsvDescCol] = useState('Açıklama');
  const [csvAmtCol, setCsvAmtCol] = useState('Tutar');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string | null>(null);

  // İşlem Düzenleme State'leri
  const [editingTx, setEditingTx] = useState<ApiResponse | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Diğer');
  const [editMerchant, setEditMerchant] = useState('');
  const [editIntent, setEditIntent] = useState('EXPENSE');
  const [editDate, setEditDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([
    { role: 'model', content: 'Merhaba! Ben FinAI Finansal Asistanınız. Bütçeniz veya harcamalarınız hakkında benden öneri almak ister misiniz?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login'); // Oturum yoksa Login'e at
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchTransactions(parsed.id, dateRange);
        fetchBudgets(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  const fetchTransactions = (userId: string, range: string = dateRange) => {
    setTxLoading(true);
    const query = range ? `?range=${range}` : '';
    fetchWithAuth(`/api/transactions/${userId}${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      })
      .catch((err) => console.error("Geçmiş veriler çekilemedi:", err))
      .finally(() => setTxLoading(false));
  };

  const handleRangeChange = (newRange: string) => {
    setDateRange(newRange);
    if (user) {
      fetchTransactions(user.id, newRange);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!user) return;
    const exportUrl = `http://localhost:5115/api/reports/export?userId=${user.id}&format=${format}&range=${dateRange}`;
    window.open(exportUrl, '_blank');
  };

  const fetchBudgets = (userId: string) => {
    setBudgetLoading(true);
    fetchWithAuth(`/api/budgets/summary/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBudgets(data);
        }
      })
      .catch((err) => console.error("Bütçe verileri çekilemedi:", err))
      .finally(() => setBudgetLoading(false));
  };

  const handleLogout = () => {
    logout();
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !budgetCategory || !budgetLimitAmount) return;

    setBudgetSubmitLoading(true);
    try {
      const response = await fetchWithAuth('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          category: budgetCategory,
          limitAmount: parseFloat(budgetLimitAmount)
        })
      });

      if (!response.ok) {
        throw new Error('Bütçe kaydedilemedi.');
      }

      setBudgetLimitAmount('');
      fetchBudgets(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bütçe kaydedilirken bir hata oluştu.');
    } finally {
      setBudgetSubmitLoading(false);
    }
  };

  const handleBudgetDelete = async (budgetId: string) => {
    if (!user || !confirm('Bu bütçe limitini silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithAuth(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Bütçe silinemedi.');
      }

      fetchBudgets(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Bütçe silinirken bir hata oluştu.');
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !csvFile) return;

    setCsvLoading(true);
    setCsvSuccessMessage(null);
    setCsvErrorMessage(null);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('userId', user.id);
    formData.append('dateColumn', csvDateCol);
    formData.append('descriptionColumn', csvDescCol);
    formData.append('amountColumn', csvAmtCol);

    try {
      const response = await fetchWithAuth('/api/transactions/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'CSV aktarımı başarısız oldu.');
      }

      setCsvSuccessMessage(data.message || 'Harcamalar başarıyla yüklendi.');
      setCsvFile(null);
      
      // Reload everything
      fetchTransactions(user.id);
      fetchBudgets(user.id);
    } catch (err: any) {
      console.error(err);
      setCsvErrorMessage(err.message || 'CSV yüklenirken bir hata oluştu.');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user || !confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithAuth(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('İşlem silinemedi.');
      }

      fetchTransactions(user.id);
      fetchBudgets(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'İşlem silinirken bir hata oluştu.');
    }
  };

  const handleStartEdit = (tx: ApiResponse) => {
    setEditingTx(tx);
    setEditAmount(tx.parsedData.amount.toString());
    setEditCategory(tx.parsedData.category);
    setEditMerchant(tx.parsedData.merchantOrTitle);
    setEditIntent(tx.parsedData.intent || 'EXPENSE');
    setEditDate(tx.parsedData.transactionDate || new Date().toISOString().split('T')[0]);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTx) return;

    setEditLoading(true);
    try {
      const response = await fetchWithAuth(`/api/transactions/${editingTx.transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          category: editCategory,
          merchantOrTitle: editMerchant,
          intent: editIntent,
          transactionDate: new Date(editDate).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('İşlem güncellenemedi.');
      }

      setEditingTx(null);
      fetchTransactions(user.id);
      fetchBudgets(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'İşlem güncellenirken bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    // Prepare budget context to send to AI
    const budgetContext = JSON.stringify(
      budgets.map(b => ({
        category: b.category,
        limitAmount: b.limitAmount,
        currentSpent: b.currentSpent,
        percentage: b.percentage
      }))
    );

    try {
      const response = await fetchWithAuth('/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          message: userMsg,
          history: chatHistory.slice(1),
          contextJson: budgetContext
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Asistan yanıt veremedi.');
      }

      setChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', content: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/parse-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          inputText: inputText,
          dateStr: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Backend ile iletişim kurulurken bir hata oluştu.');
      }

      const data: ApiResponse = await response.json();
      setTransactions((prev) => [data, ...prev]);
      setInputText('');
      fetchBudgets(user.id);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-medium">Yönlendiriliyor...</span>
        </div>
      </div>
    );
  }

  const totalExpense = transactions.reduce((acc, curr) => acc + (Number(curr.parsedData?.amount) || 0), 0);

  const categoryData = Object.values(
    transactions.reduce((acc: any, curr) => {
      const cat = curr.parsedData?.category || 'Diğer';
      const amt = Number(curr.parsedData?.amount) || 0;
      if (!acc[cat]) {
        acc[cat] = { name: cat, value: 0 };
      }
      acc[cat].value += amt;
      return acc;
    }, {})
  );

  return (
    <AppLayout>
      <div className="space-y-5 select-none">
        {/* Top Header & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
              Hoş geldiniz, {user.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Finansal durumunuzu, bütçe limitlerinizi ve yapay zeka analizlerinizi tek ekrandan takip edin.</p>
          </div>

          {/* Action Control Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter Dropdown */}
            <select
              value={dateRange}
              onChange={(e) => handleRangeChange(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
            >
              <option value="thisMonth">Bu Ay</option>
              <option value="lastMonth">Geçen Ay</option>
              <option value="last30">Son 30 Gün</option>
              <option value="last90">Son 90 Gün</option>
              <option value="yearly">Bu Yıl</option>
              <option value="all">Tüm Zamanlar</option>
            </select>

            {/* Export Buttons */}
            <button
              onClick={() => handleExport('excel')}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
              title="Excel / CSV Raporu İndir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
              title="PDF Raporu İndir / Yazdır"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>PDF</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => router.push('/notifications')}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer relative"
              title="Bildirim & Anomali Merkezi"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Budget Warning Notifications */}
        {budgets.some(b => b.percentage >= 80) && (
          <div className="space-y-3">
            {budgets.filter(b => b.percentage >= 80).map((budget) => {
              const isOverLimit = budget.percentage >= 100;
              return (
                <div 
                  key={budget.budgetId} 
                  className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 border backdrop-blur-xl shadow-md ${
                    isOverLimit 
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300' 
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isOverLimit ? 'bg-rose-100 dark:bg-rose-900/60' : 'bg-amber-100 dark:bg-amber-900/60'}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {isOverLimit ? 'Bütçe Aşımı Uyarısı!' : 'Bütçe Limiti Uyarısı!'}
                      </h3>
                      <p className="text-xs opacity-90 mt-0.5 font-medium">
                        {budget.category} kategorisindeki aylık bütçe limitiniz {isOverLimit ? 'aşılmıştır' : '%80 seviyesine ulaşmıştır'}. 
                        Harcama: ₺{budget.currentSpent.toLocaleString('tr-TR')} / Limit: ₺{budget.limitAmount.toLocaleString('tr-TR')} (%{budget.percentage})
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4-Column Prestige Metric Cards */}
        {txLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Toplam İşlem */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Toplam İşlem</span>
                <div className="bg-[var(--accent-soft)] text-[var(--primary)] w-9 h-9 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">{transactions.length} adet</div>
              <div className="mt-1.5 text-[11px] text-slate-400">Bu ay güncellendi</div>
            </div>

            {/* Card 2: Anlık İşlenen Tutar */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bu Ay Harcanan</span>
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 w-9 h-9 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              <div className="mt-1.5 text-[11px] text-slate-400">Geçen aya göre takip ediliyor</div>
            </div>

            {/* Card 3: AI Doğruluğu */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700" title="Son 30 gündeki Gemini LLM Güven Skoru Ortalama Başarı Oranı">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Ayrıştırma Doğruluğu</span>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-9 h-9 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">%98.4</div>
              <div className="mt-1.5 text-[11px] text-slate-400">Gemini 2.5 Flash</div>
            </div>

            {/* Card 4: Bütçe Sağlığı */}
            <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bütçe Limiti Durumu</span>
                <div className="bg-[var(--accent-soft)] text-[var(--primary)] w-9 h-9 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">
                {budgets.length > 0 ? `${budgets.length} kategori` : 'Tanımlanmadı'}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400">Otomatik aşım takibi aktif</div>
            </div>
          </div>
        )}

        {/* AI Input & OCR Section */}
        <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-700">
          <div className="flex border-b border-slate-200 dark:border-slate-700 pb-3.5 justify-between items-center">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('single')}
                className={`pb-3.5 -mb-[15px] px-0.5 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'single'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                Tekli Harcama Ekle
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`pb-3.5 -mb-[15px] px-0.5 text-[13.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'csv'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                Banka Ekstresi (CSV)
              </button>
            </div>
            <Sparkles className="w-[18px] h-[18px] text-[var(--primary)]" />
          </div>

          {activeTab === 'single' ? (
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Örn: Dün Akbank hesabımdan Trendyol üzerinden 1250 TL giyim alışverişi yaptım"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-7 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-opacity text-sm cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Çözümle & Kaydet</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Suggestion Chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className="text-slate-400 font-semibold shrink-0">Hızlı örnekler:</span>
                <button
                  type="button"
                  onClick={() => setInputText("Starbucks 180 TL kahve aldım")}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
                >
                  Starbucks 180 TL kahve
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Trendyoldan 530 TL giyim alışverişi yapıldı")}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
                >
                  Trendyol 530 TL giyim
                </button>
                <button
                  type="button"
                  onClick={() => setInputText("Migros 450 TL mutfak market alışverişi yapıldı")}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-medium transition-colors cursor-pointer hover:border-[var(--primary)]"
                >
                  Migros 450 TL market
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCsvSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Ekstre Dosyası Seç (CSV veya Excel .xlsx)</label>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      required
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-2.5 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Tarih Kolon Adı</label>
                    <input
                      type="text"
                      required
                      value={csvDateCol}
                      onChange={(e) => setCsvDateCol(e.target.value)}
                      placeholder="Tarih"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Açıklama Kolon Adı</label>
                    <input
                      type="text"
                      required
                      value={csvDescCol}
                      onChange={(e) => setCsvDescCol(e.target.value)}
                      placeholder="Açıklama"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="w-1/3">
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Tutar Kolon Adı</label>
                    <input
                      type="text"
                      required
                      value={csvAmtCol}
                      onChange={(e) => setCsvAmtCol(e.target.value)}
                      placeholder="Tutar"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={csvLoading || !csvFile}
                    className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-7 py-3 rounded-lg flex items-center gap-2 transition-opacity cursor-pointer text-sm disabled:opacity-50"
                  >
                    {csvLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Ekstreyi Çözümle & Aktar</span>
                        <ArrowUpRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
              {csvSuccessMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{csvSuccessMessage}</span>
                </div>
              )}
              {csvErrorMessage && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{csvErrorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget Management & Budget Limit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3.5">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Percent className="w-[18px] h-[18px] text-[var(--primary)]" />
                <span>Bütçe Takip Göstergeleri</span>
              </h2>
              <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Bu ay
              </span>
            </div>
            
            {budgetLoading ? (
              <div className="space-y-4">
                <BudgetSkeleton />
                <BudgetSkeleton />
                <BudgetSkeleton />
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Henüz Bütçe Limiti Tanımlanmadı</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Sağ taraftaki formdan harcama kategorileriniz için aylık bütçe limitleri ekleyerek bütçenizi kontrol altında tutabilirsiniz.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgets.map((budget) => {
                  const percent = Math.min(budget.percentage, 100);
                  const isOver = budget.percentage >= 100;
                  const isWarning = budget.percentage >= 80 && budget.percentage < 100;
                  const fillColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-[var(--primary)]';

                  return (
                    <div key={budget.budgetId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[13.5px]">{budget.category}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isOver
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300'
                              : isWarning
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
                                : 'bg-[var(--accent-soft)] text-[var(--primary)]'
                          }`}>
                            %{budget.percentage}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                            ₺{budget.currentSpent.toLocaleString('tr-TR')} / ₺{budget.limitAmount.toLocaleString('tr-TR')}
                          </span>
                          <button
                            onClick={() => handleBudgetDelete(budget.budgetId)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="Bütçe Limitini Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3.5 flex items-center gap-2.5">
              <Plus className="w-[18px] h-[18px] text-[var(--primary)]" />
              <span>Bütçe Limiti Ekle</span>
            </h2>

            <form onSubmit={handleBudgetSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Kategori</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  <option value="Gıda/Market">Gıda/Market</option>
                  <option value="Ulaşım">Ulaşım & Benzin</option>
                  <option value="Eğlence">Eğlence & Sosyal</option>
                  <option value="Fatura">Fatura & Aidat</option>
                  <option value="Giyim">Giyim & Moda</option>
                  <option value="Teknoloji">Teknoloji & Dijital</option>
                  <option value="Sağlık">Sağlık & Medikal</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Aylık Limit (₺)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={budgetLimitAmount}
                  onChange={(e) => setBudgetLimitAmount(e.target.value)}
                  placeholder="Örn: 5000"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={budgetSubmitLoading}
                className="w-full bg-[var(--primary)] hover:opacity-90 text-white font-semibold py-3 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
              >
                {budgetSubmitLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Limit Kaydet</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Charts */}
        {/* Charts & Analytics Section */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Donut Pie Chart */}
            <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
                <PieChartIcon className="w-[18px] h-[18px] text-[var(--primary)]" />
                <span>Kategoriye Göre Dağılım</span>
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        color: isDarkMode ? '#f8fafc' : '#1e293b'
                      }}
                      itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#1e293b', fontWeight: 600 }}
                      formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Toplam Tutar']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700">
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5">
                <BarChart3 className="w-[18px] h-[18px] text-[var(--primary)]" />
                <span>Kategori Bazlı Toplamlar</span>
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                    <YAxis stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                      itemStyle={{ color: '#3454a0', fontWeight: 700 }}
                      formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Tutar']}
                    />
                    <Bar dataKey="value" fill="#3454a0" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
              <ReceiptIcon className="w-[18px] h-[18px] text-[var(--primary)]" />
              <span>Son İşlemler</span>
            </h2>
            <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {transactions.length} kayıt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6 border-b border-slate-200 dark:border-slate-700">İşlem ID</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">İşyeri / Başlık</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Kategori</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tutar</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tarih</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Durum</th>
                  <th className="p-4 pr-6 text-right border-b border-slate-200 dark:border-slate-700">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {txLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                      Henüz işlenmiş bir harcama kaydı bulunmuyor. Yukarıdaki yapay zeka alanından ilk harcamanızı anında ekleyebilirsiniz!
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6 border-t border-slate-100 dark:border-slate-800 font-mono text-[11.5px] text-slate-400">{tx.transactionId?.substring(0, 8)}...</td>
                      <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">{tx.parsedData?.merchantOrTitle || 'Bilinmeyen'}</td>
                      <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                          {tx.parsedData?.category || 'Diğer'}
                        </span>
                      </td>
                      <td className={`p-4 border-t border-slate-100 dark:border-slate-800 font-bold text-[13.5px] ${tx.parsedData?.intent === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.parsedData?.intent === 'INCOME' ? '+' : '−'}₺{Number(tx.parsedData?.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-[12.5px] text-slate-500 dark:text-slate-400">{tx.parsedData?.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0]}</td>
                      <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> İşlendi
                        </span>
                      </td>
                      <td className="p-4 pr-6 border-t border-slate-100 dark:border-slate-800 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <button
                            onClick={() => handleStartEdit(tx)}
                            className="text-slate-400 hover:text-[var(--primary)] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="İşlemi Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.transactionId)}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="İşlemi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingTx && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                İşlemi Güncelle
              </h3>
              
              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block font-medium">Tutar (₺)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşlem Türü</label>
                    <select
                      value={editIntent}
                      onChange={(e) => setEditIntent(e.target.value)}
                      className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="EXPENSE">Gider (Harcama)</option>
                      <option value="INCOME">Gelir</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-medium">Kategori</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="Gıda/Market">Gıda/Market</option>
                    <option value="Ulaşım">Ulaşım</option>
                    <option value="Eğlence">Eğlence</option>
                    <option value="Fatura">Fatura</option>
                    <option value="Giyim">Giyim</option>
                    <option value="Teknoloji">Teknoloji</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşyeri / Başlık</label>
                  <input
                    type="text"
                    required
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-medium">İşlem Tarihi</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm transition-colors cursor-pointer font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                  >
                    {editLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Chat Widget - geçici olarak devre dışı */}
      {false && (
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen ? (
          <div className="bg-white rounded-3xl w-80 md:w-96 h-[480px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">
            {/* Chat Header */}
            <div className="bg-[var(--primary)] p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold text-sm">FinAI Danışmanı</h3>
                  <span className="text-[10px] text-indigo-100">Akıllı Asistanınız</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/60 select-text cursor-text">
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed select-text cursor-text ${
                      msg.role === 'user'
                        ? 'bg-[var(--primary)] text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {msg.content.replace(/\*\*/g, '').replace(/#/g, '')}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="border-t border-slate-100 p-3 bg-white flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Tasarruf için öneri iste..."
                className="flex-1 input-light rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="btn-gradient text-white px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="btn-gradient p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-6 h-6 animate-pulse text-white" />
          </button>
        )}
      </div>
      )}
    </div>
    </AppLayout>
  );
}