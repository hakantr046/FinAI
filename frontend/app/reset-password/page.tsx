'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '../../lib/apiClient';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qpEmail = searchParams.get('email');
    const qpToken = searchParams.get('token');
    if (qpEmail) setEmail(qpEmail);
    if (qpToken) setToken(qpToken);
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Girdiğiniz şifreler birbirleriyle eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Şifre sıfırlama başarısız oldu.');
      }

      setSuccess(data.message || 'Şifreniz başarıyla yenilendi! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50/50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="blob-1 top-10 right-10 opacity-50"></div>
      <div className="blob-2 bottom-20 left-10 opacity-40"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-gradient-to-r from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20 mb-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">FinAI</h1>
          <p className="text-xs text-slate-500 mt-1">Güvenli Şifre Yenileme Portalı</p>
        </div>

        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Yeni Şifre Belirleyin</h2>
            <p className="text-xs text-slate-500">Lütfen hesabınız için yeni bir şifre oluşturun</p>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              <span>{success}</span>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@finai.com"
                    className="w-full input-light rounded-xl pl-10 pr-4 py-3 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full input-light rounded-xl pl-10 pr-10 py-3 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Yeni Şifre Tekrarı</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifreyi tekrar yazın"
                    className="w-full input-light rounded-xl pl-10 pr-10 py-3 text-xs font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient font-semibold py-3 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Şifreyi Güncelle & Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100">
            <Link href="/login" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">
              Giriş sayfasına geri dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
