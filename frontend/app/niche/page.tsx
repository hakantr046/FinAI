'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, 
  Calculator, 
  Users, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  CreditCard,
  Building
} from 'lucide-react';
import { fetchWithAuth, logout } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { Sun, Moon } from 'lucide-react';

interface InvoiceItem {
  id: string;
  clientName: string;
  amountBeforeVat: number;
  vatRatePercent: number;
  vatAmount: number;
  totalAmount: number;
  description: string;
  isPaid: boolean;
  issueDate: string;
  dueDate: string;
}

export default function NichePage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'esnaf' | 'family'>('esnaf');

  // KDV Calculator State
  const [baseAmount, setBaseAmount] = useState<string>('10000');
  const [vatRate, setVatRate] = useState<number>(20);
  const [calculatedVat, setCalculatedVat] = useState<number>(2000);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(12000);

  // Invoice Tracking State
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalVatSum, setTotalVatSum] = useState<number>(0);
  const [totalInvoiceSum, setTotalInvoiceSum] = useState<number>(0);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // New Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invVatRate, setInvVatRate] = useState<number>(20);
  const [invDescription, setInvDescription] = useState('');
  const [invIsPaid, setInvIsPaid] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Family Budget Splitter State
  const [billTitle, setBillTitle] = useState('Ev Kirası & Faturalar');
  const [totalBill, setTotalBill] = useState('15000');
  const [members, setMembers] = useState<string>('Ahmet, Ayşe, Mehmet');
  const [splitResult, setSplitResult] = useState<{ name: string; share: number }[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchInvoices(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  useEffect(() => {
    const amt = parseFloat(baseAmount) || 0;
    const vat = amt * (vatRate / 100);
    setCalculatedVat(vat);
    setCalculatedTotal(amt + vat);
  }, [baseAmount, vatRate]);

  const fetchInvoices = (userId: string) => {
    setLoadingInvoices(true);
    fetchWithAuth(`/api/invoices/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.invoices && Array.isArray(data.invoices)) {
          setInvoices(data.invoices);
          setTotalVatSum(data.totalVat || 0);
          setTotalInvoiceSum(data.totalAmount || 0);
        }
      })
      .catch((err) => console.error('Faturalar çekilemedi:', err))
      .finally(() => setLoadingInvoices(false));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientName || !invAmount) return;

    setSubmittingInvoice(true);

    try {
      const response = await fetchWithAuth('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          clientName,
          amountBeforeVat: parseFloat(invAmount),
          vatRatePercent: invVatRate,
          description: invDescription,
          isPaid: invIsPaid,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Fatura kaydedilemedi.');

      setIsInvoiceModalOpen(false);
      setClientName('');
      setInvAmount('');
      setInvDescription('');
      fetchInvoices(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Fatura kaydetme hatası.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Bu fatura kaydını silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithAuth(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Fatura silinemedi.');
      fetchInvoices(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleCalculateFamilySplit = () => {
    const total = parseFloat(totalBill) || 0;
    const memberList = members.split(',').map((m) => m.trim()).filter((m) => m.length > 0);
    if (memberList.length === 0 || total <= 0) return;

    const perPerson = Math.round((total / memberList.length) * 100) / 100;
    setSplitResult(memberList.map((m) => ({ name: m, share: perPerson })));
  };

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Niş Finans Paketi (Esnaf & Aile Bütçesi)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Esnaf / serbest meslek KDV ve fatura takibi, Aile & Ortak ev harcaması bölüştürücü
            </p>
          </div>
        </div>

        {/* Tab Selector Buttons & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
            title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('esnaf')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'esnaf'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Esnaf & KDV Modülü</span>
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'family'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Aile & Ortak Bütçe</span>
          </button>
        </div>
      </div>
      </div>

      {activeTab === 'esnaf' ? (
        <div className="space-y-6 animate-fade-in">
          {/* KDV Calculator */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              KDV & Stopaj Hesaplayıcı (%1, %10, %20)
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4 lg:col-span-1">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 block font-bold">Matrah / Net Tutar (₺)</label>
                  <input
                    type="number"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 mb-1.5 block font-bold">KDV Oranı</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 10, 20].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setVatRate(rate)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          vatRate === rate
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        %{rate}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Calculation Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1 shadow-sm">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold block">Hesaplanan KDV Tutarı</span>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₺{calculatedVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Devlete Ödenecek/İndirilecek KDV</span>
                </div>

                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1 shadow-sm">
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block">KDV Dahil Toplam Tutar</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₺{calculatedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Müşteriye Kesilecek Fatura Tutarı</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Log & Summary */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Kesilen Fatura Takibi & KDV Raporu
              </h2>

              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Fatura Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase block">Toplam Ciro (KDV Dahil)</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">₺{totalInvoiceSum.toLocaleString('tr-TR')}</span>
              </div>
              <div className="p-4 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase block">Biriken Toplam KDV</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₺{totalVatSum.toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Müşteri / Firma</th>
                    <th className="p-4">Matrah</th>
                    <th className="p-4">KDV Oranı</th>
                    <th className="p-4">KDV Tutarı</th>
                    <th className="p-4">Toplam Tutar</th>
                    <th className="p-4 text-right">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {loadingInvoices ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-xs">Yükleniyor...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-xs">Henüz kesilen fatura kaydı bulunmuyor.</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="table-row-hover">
                        <td className="p-4 font-semibold text-slate-800 dark:text-white">{inv.clientName}</td>
                        <td className="p-4 font-mono text-xs">₺{inv.amountBeforeVat.toLocaleString('tr-TR')}</td>
                        <td className="p-4"><span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">%{inv.vatRatePercent}</span></td>
                        <td className="p-4 font-semibold text-indigo-600">₺{inv.vatAmount.toLocaleString('tr-TR')}</td>
                        <td className="p-4 font-bold text-emerald-600">₺{inv.totalAmount.toLocaleString('tr-TR')}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Family / Shared Budget Splitter Tab */
        <div className="glass-card rounded-3xl p-6 space-y-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Users className="w-5 h-5 text-indigo-500" />
            Aile & Ortak Ev Harcaması Bölüştürücü
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Harcama/Fatura Başlığı</label>
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Toplam Ödenen Tutar (₺)</label>
                <input
                  type="number"
                  value={totalBill}
                  onChange={(e) => setTotalBill(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Ortaklar / Aile Bireyleri (Virgülle Ayırın)</label>
                <input
                  type="text"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  placeholder="Ahmet, Ayşe, Mehmet"
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                onClick={handleCalculateFamilySplit}
                className="w-full btn-gradient py-3 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Kişi Başı Düşen Payı Hesapla
              </button>
            </div>

            {/* Split Results */}
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bölüşüm Sonuçları</span>

              {splitResult.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                  Sol taraftaki bilgileri doldurup "Hesapla" butonuna basarak bütçe paylaşımını görün.
                </div>
              ) : (
                <div className="space-y-3">
                  {splitResult.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between shadow-sm"
                    >
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{res.name}</span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Ödemesi Gereken Pay</span>
                        <span className="font-bold text-indigo-600 text-base">₺{res.share.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Creation Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <FileText className="w-5 h-5 text-indigo-500" />
              Yeni Fatura Kaydı Oluştur
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Müşteri / Firma Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ABC Teknoloji A.Ş."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Matrah (KDV Hariç ₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10000"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">KDV Oranı</label>
                  <select
                    value={invVatRate}
                    onChange={(e) => setInvVatRate(parseInt(e.target.value))}
                    className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                  >
                    <option value={20}>%20</option>
                    <option value={10}>%10</option>
                    <option value={1}>%1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">Açıklama / Ürün</label>
                <input
                  type="text"
                  placeholder="Yazılım Danışmanlık Hizmeti"
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="flex-1 btn-gradient text-white font-medium py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingInvoice ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
