'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Target, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp,
  Award,
  Clock,
  PiggyBank
} from 'lucide-react';
import { fetchWithAuth, logout } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { Sun, Moon } from 'lucide-react';

interface GoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function GoalsPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Birikim');
  const [submitting, setSubmitting] = useState(false);

  // Deposit Modal States
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // AI Projection Modal
  const [aiProjection, setAiProjection] = useState<{
    estimatedCompletionDate: string;
    recommendedMonthlySaving: number;
    adviceText: string;
  } | null>(null);
  const [projectingGoalId, setProjectingGoalId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchGoals(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  const fetchGoals = (userId: string) => {
    setLoading(true);
    fetchWithAuth(`/api/goals/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGoals(data);
        }
      })
      .catch((err) => console.error('Hedefler çekilemedi:', err))
      .finally(() => setLoading(false));
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !targetAmount) return;

    setSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount || '0'),
          deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          category,
        }),
      });

      if (!response.ok) throw new Error('Hedef kaydedilemedi.');

      setIsGoalModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      fetchGoals(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Hedef oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount) return;

    setDepositing(true);

    try {
      const response = await fetchWithAuth(`/api/goals/${selectedGoal.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });

      if (!response.ok) throw new Error('Para eklenemedi.');

      setSelectedGoal(null);
      setDepositAmount('');
      fetchGoals(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deposit hatası.');
    } finally {
      setDepositing(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Bu finansal hedefi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithAuth(`/api/goals/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Hedef silinemedi.');
      fetchGoals(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleAiProjection = async (goal: GoalItem) => {
    setProjectingGoalId(goal.id);
    setAiProjection(null);

    try {
      const response = await fetchWithAuth(`/api/goals/${goal.id}/ai-projection`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'AI Projeksiyonu alınamadı.');

      setAiProjection(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setProjectingGoalId(null);
    }
  };

  const totalTargetSum = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalCurrentSum = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallProgress = totalTargetSum > 0 ? Math.min(100, Math.round((totalCurrentSum / totalTargetSum) * 100)) : 0;

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
              Finansal Hedefler
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Birikim hedeflerinizi tanımlayın ve adım adım takip edin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="btn-gradient px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hedef Oluştur</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics Card */}
      <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-200 dark:border-slate-700">
        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Toplam Biriktirilen</span>
          <div className="text-[24px] font-bold text-emerald-600 my-1">₺{totalCurrentSum.toLocaleString('tr-TR')}</div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hedeflenen ₺{totalTargetSum.toLocaleString('tr-TR')} içinde</span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Genel İlerleme</span>
          <div className="text-[24px] font-bold text-[var(--primary)] my-1">%{overallProgress}</div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-[var(--primary)] h-full rounded-full transition-all" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aktif Hedef Sayısı</span>
          <div className="text-[24px] font-bold text-slate-900 dark:text-white my-1">{goals.filter(g => g.status === 'IN_PROGRESS').length} Hedef</div>
          <span className="text-xs text-emerald-600 font-bold">{goals.filter(g => g.status === 'COMPLETED').length} tamamlandı</span>
        </div>
      </div>

      {/* Goals Grid */}
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
                <div
                  key={goal.id}
                  className="glass-card border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[14.5px] text-slate-900 dark:text-white mb-1">{goal.title}</h3>
                      <span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">
                        {goal.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
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

                  {/* Amounts */}
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setSelectedGoal(goal)}
                      disabled={isCompleted}
                      className="flex-1 btn-gradient py-2.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Para Ekle</span>
                    </button>

                    <button
                      onClick={() => handleAiProjection(goal)}
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

      {/* AI Projection Modal */}
      {aiProjection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Gemini AI Hedef Tahmin Raporu
            </h3>

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-2">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">Tahmini Tamamlanma Tarihi</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{aiProjection.estimatedCompletionDate}</span>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl space-y-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">Tavsiye Edilen Aylık Tasarruf</span>
                <span className="text-xl font-bold text-emerald-600">₺{aiProjection.recommendedMonthlySaving?.toLocaleString('tr-TR')} / ay</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Yapay Zeka Önerisi:</strong> {aiProjection.adviceText}
              </div>
            </div>

            <button
              onClick={() => setAiProjection(null)}
              className="w-full btn-gradient py-2.5 rounded-xl font-semibold text-xs cursor-pointer mt-2"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Target className="w-5 h-5 text-indigo-500" />
              Yeni Finansal Hedef Tanımla
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ev Peşinatı, Araba, Yaz Tatili"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Tutar (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Mevcut Birikim (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold text-emerald-600"
                  />
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
                    <option value="Birikim">Birikim</option>
                    <option value="Tatil">Tatil</option>
                    <option value="Ev/Araba">Ev/Araba</option>
                    <option value="Acil Durum">Acil Durum</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Hedef Tarihi</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Hedefi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              "{selectedGoal.title}" Hedefine Birikim Ekle
            </h3>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Eklenen Tasarruf Miktarı (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  {depositing ? 'Ekleniyor...' : 'Birikimi Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
