'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Sparkles, Lock, Mail, TrendingUp, Shield, Zap, ArrowRight, Eye, EyeOff, Sun, Moon, User as UserIcon, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../lib/apiClient';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const KVKK_TEXT = `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kayıt formunda paylaştığınız ad-soyad, e-posta adresi ve (varsa) Google hesap bilgileriniz; FinAI hesabınızın oluşturulması, kimlik doğrulaması, hizmetin sunulması ve yasal yükümlülüklerin yerine getirilmesi amacıyla veri sorumlusu sıfatıyla FinAI tarafından işlenmektedir. Verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen işleme şartlarına uygun olarak, yalnızca hizmetin sunulması için gerekli süre boyunca saklanır ve açık rızanız ya da kanunda öngörülen istisnalar dışında üçüncü kişilerle paylaşılmaz. KVKK'nın 11. maddesi kapsamındaki haklarınızı (verilerinize erişme, düzeltme, silme, işlenmesine itiraz etme dahil) kullanmak için bizimle iletişime geçebilirsiniz.`;

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [kvkkExpanded, setKvkkExpanded] = useState(false);
  const [fromGoogle, setFromGoogle] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fromGoogle') === '1') {
      setFromGoogle(true);
    }
  }, []);

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

    router.push(data.user.isAdmin ? '/admin' : '/');
  };

  const handleGoogleCredential = async (response: { credential: string }) => {
    if (!kvkkAccepted) {
      setError('Google ile devam etmek için önce KVKK Aydınlatma Metni\'ni onaylamalısınız.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential, allowRegister: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google ile kayıt başarısız oldu.');
      }
      completeLogin(data);
    } catch (err: any) {
      setError(err.message || 'Google ile bağlanılamadı.');
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
      text: 'signup_with',
      locale: 'tr',
    });
  };

  useEffect(() => {
    initGoogleButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDarkMode]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kvkkAccepted) {
      setError('Kayıt olabilmek için KVKK Aydınlatma Metni\'ni onaylamalısınız.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız oldu.');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Sunucuya bağlanılamadı.');
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
              Yapay zeka destekli kişisel finans yönetim platformu ile harcamalarınızı akıllıca yönetin.
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

      {/* Right - Register Form Panel */}
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
              <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hesap Oluştur</h2>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>FinAI'a katılarak harcamalarınızı yönetin.</p>
            </div>

            {fromGoogle && (
              <div className={`p-3.5 rounded-lg text-xs font-medium ${
                isDarkMode ? 'bg-indigo-950/50 border border-indigo-800/60 text-indigo-300' : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
              }`}>
                Bu Google hesabına ait bir FinAI hesabı bulunamadı. Aşağıdaki KVKK metnini onaylayıp "Google ile Kayıt Ol" ile devam edebilirsiniz.
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Ad Soyad</label>
                <div className="relative">
                  <UserIcon className={`w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ad Soyad"
                    className={`w-full rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none transition-all ${
                      isDarkMode
                        ? 'bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
              </div>

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
              </div>

              {error && (
                <div className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !kvkkAccepted}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Kayıt Ol</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* KVKK Consent */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-text">
                  <input
                    type="checkbox"
                    checked={kvkkAccepted}
                    onChange={(e) => { setKvkkAccepted(e.target.checked); if (e.target.checked) setError(null); }}
                    className="mt-0.5 w-4 h-4 rounded shrink-0 accent-blue-700 cursor-pointer"
                  />
                  <span className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setKvkkExpanded((v) => !v); }}
                      className={`font-semibold hover:underline cursor-pointer ${isDarkMode ? 'text-indigo-400' : 'text-blue-700'}`}
                    >
                      KVKK Aydınlatma Metni'ni
                    </button>
                    {' '}okudum, anladım ve kişisel verilerimin işlenmesini kabul ediyorum.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setKvkkExpanded((v) => !v)}
                  className={`flex items-center gap-1 text-[11px] font-medium cursor-pointer ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span>{kvkkExpanded ? 'Metni gizle' : 'Metnin tamamını göster'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${kvkkExpanded ? 'rotate-180' : ''}`} />
                </button>

                {kvkkExpanded && (
                  <div className={`text-[11px] leading-relaxed max-h-40 overflow-y-auto rounded-lg p-3 ${
                    isDarkMode ? 'bg-slate-900 border border-slate-700 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-500'
                  }`}>
                    {KVKK_TEXT}
                  </div>
                )}
              </div>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>veya</span>
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
                <div
                  className={`flex justify-center transition-opacity ${!kvkkAccepted ? 'opacity-50 pointer-events-none' : ''}`}
                  ref={googleButtonRef}
                />
                {!kvkkAccepted && (
                  <p className={`text-[11px] text-center -mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Google ile devam etmek için önce yukarıdaki KVKK onayını işaretleyin.
                  </p>
                )}
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onLoad={initGoogleButton}
                />
              </>
            )}

            <div className={`text-center pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <Link href="/login" className={`text-sm transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Zaten hesabınız var mı?{' '}
                <span className={`font-semibold hover:underline ${isDarkMode ? 'text-indigo-400' : 'text-blue-600'}`}>Giriş Yapın</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
