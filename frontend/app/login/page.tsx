'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Sparkles, Lock, Mail, TrendingUp, Shield, Zap, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const completeLogin = (data: any) => {
    localStorage.setItem('finai_user', JSON.stringify({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      token: data.accessToken || data.token,
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken || null,
      isAdmin: data.user.isAdmin
    }));

    if (data.user.isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const handleGoogleCredential = async (response: { credential: string }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5115/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential, allowRegister: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 && data.accountNotFound) {
          router.push('/register?fromGoogle=1');
          return;
        }
        throw new Error(data.message || 'Google ile giriş başarısız oldu.');
      }
      completeLogin(data);
    } catch (err: any) {
      setError(err.message || 'Google ile girişte bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const initGoogleButton = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    googleButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: isDarkMode ? 'filled_black' : 'outline',
      size: 'large',
      width: 336,
      text: 'signin_with',
      locale: 'tr',
    });
  };

  useEffect(() => {
    initGoogleButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5115/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız oldu.');
      }

      completeLogin(data);
    } catch (err: any) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const [resetModalUrl, setResetModalUrl] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setError('Lütfen önce yukarıdaki E-posta alanına e-posta adresinizi girin.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5115/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccessMsg(data.message || 'Şifre sıfırlama e-postası üretildi.');
      if (data.resetLink) {
        setResetModalUrl(data.resetLink);
      }
    } catch (e: any) {
      setError(e.message || 'Şifre sıfırlama isteğinde bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 items-center justify-center p-12 select-none">
        {/* Faint grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-25 [mask-image:radial-gradient(ellipse_80%_65%_at_20%_15%,#000_65%,transparent_100%)] pointer-events-none"></div>
        {/* Top-left glow orb */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-indigo-500/30 blur-[100px] pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-white max-w-lg space-y-8">
          {/* Top Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            <span>Yapay Zeka Destekli Bütçe Yönetimi</span>
          </div>

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-[54px] h-[54px] flex items-center justify-center shrink-0">
                <img src="/brand/finai-logo-icon.png" alt="FinAI" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                FinAI
              </h1>
            </div>
            <p className="text-base text-slate-400 font-normal leading-relaxed pt-1 max-w-md">
              Harcamalarınızı yapay zekayla anında kategorize edin, nakit akışınızı ve bütçenizi tek ekrandan yönetin.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="bg-slate-800 w-9 h-9 rounded-lg text-indigo-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Akıllı Harcama & Fiş Ayrıştırma</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Doğal dil ve fiş görsellerini saniyeler içinde kategorize edin.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="bg-slate-800 w-9 h-9 rounded-lg text-indigo-400 flex items-center justify-center shrink-0">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Gelişmiş Veri Gizliliği</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Kimlik, IBAN ve kart bilgileriniz oturum bazlı olarak maskelenir.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="bg-slate-800 w-9 h-9 rounded-lg text-indigo-400 flex items-center justify-center shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Anomali & Bütçe Uyarıları</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">Bütçe aşımları ve alışılmadık harcamalar için anında bildirim alın.</p>
              </div>
            </div>
          </div>

          {/* Bottom Stats Row */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span>%97.8 AI Doğruluk</span>
            <span className="text-slate-700">|</span>
            <span>Uçtan Uca Veri Gizliliği</span>
            <span className="text-slate-700">|</span>
            <span>7/24 Finans Danışmanı</span>
          </div>
        </div>
      </div>

      {/* Right - Login Form Panel */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-12 relative select-none transition-colors duration-500 ${
        isDarkMode ? 'bg-slate-900 text-white' : 'bg-stone-50 text-slate-900'
      }`}>
        {/* Top Right Theme Switcher Button */}
        <div className="absolute top-6 right-6 z-50">
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Aydınlık Mod</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-500" />
                <span>Karanlık Mod</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* Mobile Logo Showcase */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 items-center justify-center">
              <img src="/brand/finai-logo-icon.png" alt="FinAI" className="w-full h-full object-contain" />
            </div>
            <h1 className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>FinAI</h1>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Akıllı Bütçe ve Nakit Akışı Yönetimi</p>
          </div>

          {/* Form Card */}
          <div className={`rounded-2xl p-8 sm:p-10 space-y-6 transition-all duration-500 ${
            isDarkMode
              ? 'bg-slate-800 border border-slate-700 shadow-sm'
              : 'bg-white border border-slate-200 shadow-sm'
          }`}>
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hoş geldiniz</h2>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hesabınıza erişmek için e-posta ve şifrenizi girin.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>E-posta Adresi</label>
                <div className="relative">
                  <Mail className={`w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@finai.app"
                    className={`w-full rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Şifre</label>
                <div className="relative">
                  <Lock className={`w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-lg pl-10 pr-11 py-3 text-sm focus:outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                      isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={handleForgotPassword} className={`text-xs hover:underline font-medium cursor-pointer transition-colors ${
                    isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-blue-600 hover:text-blue-700'
                  }`}>
                    Şifremi unuttum
                  </button>
                </div>
              </div>

              {error && (
                <div className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>veya</span>
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
                <div className="flex justify-center" ref={googleButtonRef} />
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onLoad={initGoogleButton}
                />
              </>
            )}

            <div className={`text-center pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <Link href="/register" className={`text-sm transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Hesabınız yok mu?{' '}
                <span className={`font-semibold hover:underline ${isDarkMode ? 'text-indigo-400' : 'text-blue-600'}`}>Kayıt olun</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}