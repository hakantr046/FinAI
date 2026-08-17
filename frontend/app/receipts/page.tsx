'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Receipt as ReceiptIcon, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Store, 
  CreditCard,
  FileText
} from 'lucide-react';
import { fetchWithAuth, logout } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { Sun, Moon } from 'lucide-react';

interface ParsedReceiptItem {
  name: string;
  price: number;
}

interface ReceiptResult {
  receiptId: string;
  merchantName: string;
  totalAmount: number;
  category: string;
  dateStr: string;
  itemsJson: string;
  confidenceScore: number;
}

interface ReceiptHistoryItem {
  id: string;
  merchantName: string;
  totalAmount: number;
  category: string;
  status: string;
  confidenceScore: number;
  createdAt: string;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Result & Editable Form State
  const [parsedResult, setParsedResult] = useState<ReceiptResult | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Diğer');
  const [editDate, setEditDate] = useState('');
  const [confirming, setConfirming] = useState(false);

  // History State
  const [history, setHistory] = useState<ReceiptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchHistory(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  const fetchHistory = (userId: string) => {
    setHistoryLoading(true);
    fetchWithAuth(`/api/receipts/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch((err) => console.error('Fiş geçmişi çekilemedi:', err))
      .finally(() => setHistoryLoading(false));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setParsedResult(null);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetchWithAuth('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Fiş analiz edilemedi.');
      }

      setParsedResult(data);
      setEditMerchant(data.merchantName || 'Bilinmeyen');
      setEditAmount(data.totalAmount?.toString() || '0');
      setEditCategory(data.category || 'Diğer');
      setEditDate(data.dateStr || new Date().toISOString().split('T')[0]);
      
      fetchHistory(user.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fiş yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!user || !parsedResult) return;

    setConfirming(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/receipts/${parsedResult.receiptId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: editMerchant,
          amount: parseFloat(editAmount),
          category: editCategory,
          transactionDate: new Date(editDate).toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Fiş onaylanamadı.');
      }

      setSuccessMessage('Fiş başarıyla harcama işlemleri listenize eklendi! Panele yönlendiriliyorsunuz...');
      setParsedResult(null);
      setFile(null);
      setPreviewUrl(null);
      fetchHistory(user.id);
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fiş onaylanırken hata oluştu.');
    } finally {
      setConfirming(false);
    }
  };

  const itemsList: ParsedReceiptItem[] = parsedResult?.itemsJson
    ? (() => {
        try {
          return JSON.parse(parsedResult.itemsJson);
        } catch {
          return [];
        }
      })()
    : [];

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
              Fiş & Fatura Tarama
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Fiş görsellerinizi yükleyin, yapay zeka otomatik olarak harcamalarınıza dönüştürsün.
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upload & Preview Card */}
        <div className="glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <UploadCloud className="w-[18px] h-[18px] text-[var(--primary)]" />
            Fiş / Fatura Görseli Yükle
          </h2>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-[1.5px] border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors bg-slate-50 dark:bg-slate-800/60 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Fiş Önizleme"
                    className="max-h-64 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Farklı bir görsel seçmek için üzerine tıklayın
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 py-4">
                  <UploadCloud className="w-[26px] h-[26px] text-[var(--primary)] mx-auto" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-200">
                      Görsel seçmek için tıklayın veya sürükleyin
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP desteklenir</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full btn-gradient py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Gemini Vision ile Çözümle</span>
                </>
              )}
            </button>
          </form>

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
        </div>

        {/* OCR Result & Confirmation Form */}
        <div className="glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <Sparkles className="w-[18px] h-[18px] text-[var(--primary)]" />
            AI Analiz Sonucu & Onay
          </h2>

          {!parsedResult ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm space-y-2">
              <FileText className="w-12 h-12 mx-auto opacity-30" />
              <p>Sol taraftan bir fiş görseli yükleyip analiz ettirdiğinizde detaylar burada görünecektir.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[var(--accent-soft)] border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-semibold block">AI Doğruluk Skoru</span>
                  <span className="text-[19px] font-bold text-slate-800 dark:text-white">
                    %{(parsedResult.confidenceScore * 100).toFixed(0)}
                  </span>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  Otomatik Ayrıştırıldı
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> İşyeri / Mağaza
                  </label>
                  <input
                    type="text"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Toplam Tutar (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Kategori
                  </label>
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
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full input-light rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Itemized Breakdown Table if items exist */}
              {itemsList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Tespit Edilen Ürün Kalemleri</span>
                  <div className="max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {itemsList.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2.5 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                        <span className="text-slate-500 font-mono font-semibold">₺{item.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirmReceipt}
                disabled={confirming}
                className="w-full btn-gradient py-3 rounded-lg font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {confirming ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Harcama İşlemi Olarak Kaydet</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt History Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Taranan Fiş Geçmişi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">İşyeri</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Kategori</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tutar</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tarih</th>
                <th className="p-4 border-b border-slate-200 dark:border-slate-700">Durum</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {historyLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Yükleniyor...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Henüz taranmış bir fiş bulunmuyor.</td></tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} className="table-row-hover">
                    <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">{rec.merchantName}</td>
                    <td className="p-4 border-t border-slate-100 dark:border-slate-800"><span className="text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11.5px] font-semibold">{rec.category}</span></td>
                    <td className="p-4 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">₺{rec.totalAmount?.toLocaleString('tr-TR')}</td>
                    <td className="p-4 border-t border-slate-100 dark:border-slate-800 text-[12.5px] text-slate-400">{new Date(rec.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td className="p-4 border-t border-slate-100 dark:border-slate-800">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        rec.status === 'SAVED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}>
                        {rec.status === 'SAVED' ? 'İşlendi' : 'Beklemede'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
