'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, CreditCard, Wallet, Percent, Shield, 
  Trash2, ShieldAlert, Sparkles, ArrowUpRight, 
  Sun, Moon, Plus, Pencil, X, Check 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';

interface SystemStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  averageConfidenceScore: number;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  transactionsCount: number;
  activeBudgetsCount: number;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add User Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addIsAdmin, setAddIsAdmin] = useState(false);

  // Edit User Modal States
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([
    { role: 'model', content: 'Merhaba! Ben FinAI Finansal Asistanınız. Sistem yönetimi veya kullanıcı bütçeleri hakkında benden öneri almak ister misiniz?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsed: UserSession = JSON.parse(savedUser);
      if (!parsed.isAdmin) {
        router.push('/');
      } else {
        setCurrentUser(parsed);
        loadAdminData(parsed.token);
      }
    } catch (e) {
      localStorage.removeItem('finai_user');
      router.push('/login');
    }
  }, [router]);

  const loadAdminData = async (token: string) => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const statsRes = await fetch('http://localhost:5115/api/admin/stats', { headers });
      const statsData = await statsRes.json();
      
      const usersRes = await fetch('http://localhost:5115/api/admin/users', { headers });
      const usersData = await usersRes.json();

      if (statsRes.ok) setStats(statsData);
      if (usersRes.ok) setUsersList(usersData);
    } catch (err) {
      console.error('Veriler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!currentUser) return;
    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:5115/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        loadAdminData(currentUser.token);
      } else {
        const errData = await response.json();
        alert(errData.message || 'Yetki güncellenemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('Rol değiştirilirken bir ağ hatası oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUser?.email) {
      alert('Kendinizi silemezsiniz!');
      return;
    }
    if (!currentUser || !confirm(`"${userEmail}" kullanıcısını ve ilişkili TÜM verilerini silmek istediğinize emin misiniz?`)) return;

    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:5115/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        loadAdminData(currentUser.token);
      } else {
        const errData = await response.json();
        alert(errData.message || 'Kullanıcı silinemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('Kullanıcı silinirken bir hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !addName.trim() || !addEmail.trim() || !addPassword.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5115/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          isAdmin: addIsAdmin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Kullanıcı eklenemedi.');
      }

      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddIsAdmin(false);
      loadAdminData(currentUser.token);
    } catch (err: any) {
      alert(err.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: UserDetail) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditIsAdmin(user.isAdmin);
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingUser || !editName.trim() || !editEmail.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5115/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          password: editPassword.trim() ? editPassword : null,
          isAdmin: editIsAdmin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Kullanıcı güncellenemedi.');
      }

      setEditingUser(null);
      loadAdminData(currentUser.token);
    } catch (err: any) {
      alert(err.message || 'Güncelleme hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    const adminContext = stats ? JSON.stringify(stats) : '';

    try {
      const response = await fetch('http://localhost:5115/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          message: userMsg,
          history: chatHistory.slice(1),
          contextJson: adminContext
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 text-sm font-bold">Yönetici yetkileri doğrulanıyor...</span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Yönetici Paneli
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Sistem metriklerini, üyeleri yönetin ve yeni kullanıcı yetkilendirmesi yapın
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
            title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kullanıcı Ekle</span>
          </button>

          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            Admin: {currentUser.name}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards (4 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Toplam Kayıtlı Üye</span>
                <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalUsers || 0}</div>
            </div>

            {/* Card 2 */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Toplam AI Çözümleme</span>
                <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalTransactions || 0}</div>
            </div>

            {/* Card 3 */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Toplam İşlenen Hacim</span>
                <div className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">₺{(stats?.totalVolume || 0).toLocaleString('tr-TR')}</div>
            </div>

            {/* Card 4 */}
            <div className="glass-card glass-card-hover rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">AI Doğruluk Ortalaması</span>
                <div className="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">%{stats?.averageConfidenceScore || 0}</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sistem Kullanıcıları Yönetimi</h2>
              <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                {usersList.length} Adet Kayıtlı Üye
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 font-bold">Kullanıcı Bilgileri</th>
                    <th className="p-4 font-bold">Kayıt Tarihi</th>
                    <th className="p-4 text-center font-bold">İşlemler</th>
                    <th className="p-4 text-center font-bold">Bütçeler</th>
                    <th className="p-4 text-center font-bold">Rol Yetkisi</th>
                    <th className="p-4 text-right font-bold">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="table-row-hover transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{usr.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{usr.email}</div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(usr.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {usr.transactionsCount} adet
                      </td>
                      <td className="p-4 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {usr.activeBudgetsCount} limit
                      </td>
                      <td className="p-4 text-center">
                        {usr.isAdmin ? (
                          <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> Yönetici
                          </span>
                        ) : (
                          <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            Kullanıcı
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => openEditModal(usr)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer"
                            title="Kullanıcı Bilgilerini Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleAdmin(usr.id)}
                            disabled={actionLoading === usr.id || usr.email === currentUser.email}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              usr.isAdmin
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={usr.isAdmin ? 'Yöneticilik Yetkisini Geri Al' : 'Yönetici Yap'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.email)}
                            disabled={actionLoading === usr.id || usr.email === currentUser.email}
                            className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Kullanıcıyı ve Verilerini Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Yeni Kullanıcı Ekle
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Ahmet Yılmaz"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="ahmet@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Parola</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="addIsAdmin"
                  checked={addIsAdmin}
                  onChange={(e) => setAddIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="addIsAdmin" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Yönetici (Admin) Yetkisi Ver
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Oluşturuluyor...' : 'Kullanıcıyı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Kullanıcı Düzenle
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Yeni Parola <span className="text-[10px] text-slate-400 font-normal">(Boş bırakılırsa değişmez)</span>
                </label>
                <input
                  type="password"
                  placeholder="Yeni parola belirlemek için doldurun"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="editIsAdmin"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="editIsAdmin" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Yönetici (Admin) Rolüne Sahip
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {isChatOpen ? (
          <div className="bg-white rounded-3xl w-80 md:w-96 h-[480px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white rounded-t-3xl flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-sm">FinAI Danışmanı</h3>
                  <span className="text-[10px] text-indigo-100">Gemini 2.5 Flash ile Güçlendirildi</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl rounded-tr-none shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Sistem yönetimi hakkında öneri iste..."
                className="flex-1 input-light px-4 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="btn-gradient disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-200"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="btn-gradient p-4 rounded-full shadow-2xl shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer text-white"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-xs font-semibold pr-1">Yapay Zeka Asistanı</span>
          </button>
        )}
      </div>
    </AppLayout>
  );
}
