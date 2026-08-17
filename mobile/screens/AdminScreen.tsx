import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal 
} from 'react-native';
import { 
  Shield, Users, CreditCard, Wallet, Percent, 
  Plus, ShieldAlert, Trash2, Edit2, X, CheckCircle, LogOut, Sun, Moon 
} from 'lucide-react-native';
import { fetchApi, clearUserSession, UserSession } from '../services/api';

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

export default function AdminScreen({ user, onLogout }: { user: UserSession; onLogout?: () => void }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addIsAdmin, setAddIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAdminData = async () => {
    try {
      const statsRes = await fetchApi('/api/admin/stats');
      const statsData = await statsRes.json();

      const usersRes = await fetchApi('/api/admin/users');
      const usersData = await usersRes.json();

      if (statsRes.ok) setStats(statsData);
      if (usersRes.ok) setUsersList(usersData);
    } catch (err) {
      console.error('Yönetici verileri yüklenemedi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogout = async () => {
    await clearUserSession();
    if (onLogout) onLogout();
  };

  const handleToggleAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetchApi(`/api/admin/users/${userId}/toggle-admin`, { method: 'POST' });
      if (res.ok) {
        loadAdminData();
      } else {
        const data = await res.json();
        Alert.alert('Hata', data.message || 'Yetki güncellenemedi.');
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Ağ hatası.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === user.email) {
      Alert.alert('Uyarı', 'Kendi yönetici hesabınızı silemezsiniz!');
      return;
    }

    Alert.alert(
      'Kullanıcıyı Sil',
      `"${userEmail}" kullanıcısını ve tüm verilerini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(userId);
            try {
              const res = await fetchApi(`/api/admin/users/${userId}`, { method: 'DELETE' });
              if (res.ok) {
                loadAdminData();
              } else {
                const data = await res.json();
                Alert.alert('Hata', data.message || 'Kullanıcı silinemedi.');
              }
            } catch (e: any) {
              Alert.alert('Hata', e.message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          isAdmin: addIsAdmin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kullanıcı oluşturulamadı.');

      Alert.alert('Başarılı', 'Yeni kullanıcı eklendi!');
      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddIsAdmin(false);
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const themeContainer = isDarkMode ? styles.bgDark : styles.bgLight;
  const themeHeader = isDarkMode ? styles.headerDark : styles.headerLight;
  const themeCard = isDarkMode ? styles.cardDark : styles.cardLight;
  const themeText = isDarkMode ? styles.textDark : styles.textLight;
  const themeSubText = isDarkMode ? styles.subTextDark : styles.subTextLight;

  return (
    <View style={[styles.container, themeContainer]}>
      {/* Top Ambient Glow */}
      {isDarkMode && <View style={styles.glowTop} pointerEvents="none" />}

      {/* Header Bar */}
      <View style={[styles.header, themeHeader]}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgePill}>
            <Shield size={10} color="#a5b4fc" />
            <Text style={styles.badgeText}>YÖNETİCİ KONTROL PANELİ</Text>
          </View>
          <Text style={[styles.title, themeText]}>Sistem & Üye Yönetimi</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Theme Switcher Button */}
          <TouchableOpacity 
            style={[styles.themeBtn, isDarkMode ? styles.themeBtnDark : styles.themeBtnLight]} 
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
          >
            {isDarkMode ? (
              <Sun size={18} color="#fbbf24" />
            ) : (
              <Moon size={18} color="#4f46e5" />
            )}
          </TouchableOpacity>

          {/* Add User Button */}
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Üye Ekle</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={18} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); loadAdminData(); }} 
            colors={['#6366f1']} 
            tintColor="#6366f1" 
          />
        }
      >
        {/* System Stats Cards 2x2 Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, themeCard]}>
            <View style={styles.statIconHeader}>
              <Text style={[styles.statLabel, themeSubText]}>TOPLAM ÜYE</Text>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Users size={16} color="#818cf8" />
              </View>
            </View>
            <Text style={[styles.statValue, themeText]}>{stats?.totalUsers || 0}</Text>
          </View>

          <View style={[styles.statCard, themeCard]}>
            <View style={styles.statIconHeader}>
              <Text style={[styles.statLabel, themeSubText]}>AI İŞLEMLERİ</Text>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <CreditCard size={16} color="#34d399" />
              </View>
            </View>
            <Text style={[styles.statValue, themeText]}>{stats?.totalTransactions || 0}</Text>
          </View>

          <View style={[styles.statCard, themeCard]}>
            <View style={styles.statIconHeader}>
              <Text style={[styles.statLabel, themeSubText]}>TOPLAM HACİM</Text>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Wallet size={16} color="#fbbf24" />
              </View>
            </View>
            <Text style={[styles.statValue, themeText]}>₺{(stats?.totalVolume || 0).toLocaleString('tr-TR')}</Text>
          </View>

          <View style={[styles.statCard, themeCard]}>
            <View style={styles.statIconHeader}>
              <Text style={[styles.statLabel, themeSubText]}>AI SKORU</Text>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Percent size={16} color="#c084fc" />
              </View>
            </View>
            <Text style={[styles.statValue, themeText]}>%{stats?.averageConfidenceScore || 0}</Text>
          </View>
        </View>

        {/* Users Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, themeText]}>Sistem Kullanıcıları</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{usersList.length} Üye</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 30 }} />
        ) : usersList.length === 0 ? (
          <Text style={[styles.emptyText, themeSubText]}>Henüz kayıtlı kullanıcı bulunmuyor.</Text>
        ) : (
          usersList.map((usr) => {
            const isSelf = usr.email === user.email;
            return (
              <View key={usr.id} style={[styles.userCard, themeCard]}>
                <View style={styles.userTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.userName, themeText]}>{usr.name}</Text>
                      {usr.isAdmin && (
                        <View style={styles.adminBadge}>
                          <Shield size={10} color="#a5b4fc" />
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.userEmail, themeSubText]}>{usr.email}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, usr.isAdmin ? styles.adminActiveBtn : styles.adminInactiveBtn]}
                      onPress={() => handleToggleAdmin(usr.id)}
                      disabled={actionLoading === usr.id || isSelf}
                      activeOpacity={0.7}
                    >
                      <ShieldAlert size={16} color={usr.isAdmin ? '#f59e0b' : '#818cf8'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, styles.deleteBtn, isSelf && { opacity: 0.3 }]}
                      onPress={() => handleDeleteUser(usr.id, usr.email)}
                      disabled={actionLoading === usr.id || isSelf}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#fb7185" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.userFooterRow}>
                  <Text style={[styles.userMeta, themeSubText]}>
                    Kayıt: {new Date(usr.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text style={styles.userTxMeta}>
                    {usr.transactionsCount} Harcama Kaydı
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, themeCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, themeText]}>Yeni Kullanıcı Ekle</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, themeSubText]}>AD SOYAD</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor="#64748b"
                value={addName}
                onChangeText={setAddName}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, themeSubText]}>E-POSTA ADRESİ</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                placeholder="ahmet@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={addEmail}
                onChangeText={setAddEmail}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.modalLabel, themeSubText]}>PAROLA</Text>
              <TextInput
                style={[styles.modalInput, isDarkMode ? styles.inputDark : styles.inputLight]}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={addPassword}
                onChangeText={setAddPassword}
              />
            </View>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAddIsAdmin(!addIsAdmin)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, addIsAdmin && styles.checkboxActive]}>
                {addIsAdmin && <CheckCircle size={14} color="#ffffff" />}
              </View>
              <Text style={[styles.checkboxLabel, themeText]}>Yönetici (Admin) Yetkisi Ver</Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalSubmitBtn}
                onPress={handleCreateUser}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Kullanıcıyı Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDark: {
    backgroundColor: '#030712',
  },
  bgLight: {
    backgroundColor: '#f8fafc',
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  textDark: {
    color: '#ffffff',
  },
  textLight: {
    color: '#0f172a',
  },
  subTextDark: {
    color: '#94a3b8',
  },
  subTextLight: {
    color: '#64748b',
  },
  themeBtn: {
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeBtnDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  themeBtnLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    padding: 9,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  statIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a5b4fc',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 20,
  },
  userCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  userTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c7d2fe',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminActiveBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  adminInactiveBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  userFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  userMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  userTxMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: '#030712',
    color: '#ffffff',
    borderColor: '#1e293b',
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    borderColor: '#cbd5e1',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
