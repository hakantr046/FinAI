import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, Alert 
} from 'react-native';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, 
  Sparkles, TrendingUp, CreditCard, LogOut, CheckCircle2, Shield 
} from 'lucide-react-native';
import { fetchApi, clearUserSession, UserSession } from '../services/api';

export default function HomeScreen({ user, onLogout }: { user: UserSession; onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [quickInput, setQuickInput] = useState('');
  const [parsing, setParsing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const res = await fetchApi(`/api/transactions/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);

        let expense = 0;
        let income = 0;
        data.forEach((t: any) => {
          const amt = t.parsedData?.amount || t.amount || 0;
          if (t.parsedData?.intent === 'INCOME' || t.intent === 'INCOME') {
            income += amt;
          } else {
            expense += amt;
          }
        });
        setTotalExpense(expense);
        setTotalIncome(income);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;

    setParsing(true);
    try {
      const res = await fetchApi('/api/parse-transaction', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, inputText: quickInput.trim() }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(text || 'Sunucu yanıtı okunamadı.');
      }

      if (!res.ok) throw new Error(data.message || (typeof data === 'string' ? data : 'İşlem eklenemedi.'));

      setQuickInput('');
      Alert.alert('✨ Başarılı!', `Harcama kaydedildi: ${data.parsedData?.merchantOrTitle || 'İşlem'} - ₺${data.parsedData?.amount}`);
      loadDashboardData();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Ayrıştırma hatası.');
    } finally {
      setParsing(false);
    }
  };

  const handleLogout = async () => {
    await clearUserSession();
    onLogout();
  };

  const netBalance = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      {/* Top Ambient Glow */}
      <View style={styles.glowTop} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Sparkles size={10} color="#a5b4fc" />
            <Text style={styles.aiBadgeText}>CANLI AI AKIŞI</Text>
          </View>
          <Text style={styles.greeting}>Hoş Geldiniz 👋</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={18} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboardData(); }} colors={['#6366f1']} tintColor="#6366f1" />}
      >
        {/* Net Balance Glass Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardAccentBar} />
          
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>NET BÜTÇE BAKİYESİ</Text>
            <View style={styles.statusPill}>
              <Shield size={10} color="#34d399" />
              <Text style={styles.statusText}>Canlı Senkronize</Text>
            </View>
          </View>

          <Text style={styles.balanceValue}>
            ₺{netBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={[styles.badgeIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <ArrowDownLeft size={16} color="#34d399" />
              </View>
              <View>
                <Text style={styles.subLabel}>Toplam Gelir</Text>
                <Text style={styles.incomeValue}>+₺{totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>

            <View style={styles.balanceItem}>
              <View style={[styles.badgeIcon, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
                <ArrowUpRight size={16} color="#fb7185" />
              </View>
              <View>
                <Text style={styles.subLabel}>Toplam Gider</Text>
                <Text style={styles.expenseValue}>-₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Quick Add Form Card */}
        <View style={styles.quickCard}>
          <View style={styles.quickCardHeader}>
            <View style={styles.quickTitleRow}>
              <Sparkles size={16} color="#818cf8" />
              <Text style={styles.cardHeaderTitle}>Yapay Zeka Harcama Ekle</Text>
            </View>
            <Text style={styles.quickCardSubtitle}>Cümle yazın, AI kategoriyi anında ayırsın</Text>
          </View>

          <View style={styles.quickRow}>
            <TextInput
              style={styles.quickInput}
              placeholder="Örn: Starbucks 180 TL veya Maaş 45000"
              placeholderTextColor="#64748b"
              value={quickInput}
              onChangeText={setQuickInput}
            />
            <TouchableOpacity 
              style={[styles.addBtn, parsing && styles.btnDisabled]} 
              onPress={handleQuickAdd}
              disabled={parsing}
              activeOpacity={0.8}
            >
              {parsing ? <ActivityIndicator color="#ffffff" size="small" /> : <Plus size={20} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={styles.presetChipIncome}
                onPress={() => setQuickInput('Maaş 45000 TL yatırıldı')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetIncomeText}>💼 Maaş +₺45.000</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetChipExpense}
                onPress={() => setQuickInput('Starbucks kahve 180 TL')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetExpenseText}>☕ Kahve -₺180</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.presetChipExpense}
                onPress={() => setQuickInput('Trendyol giyim 850 TL')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetExpenseText}>🛍️ Trendyol -₺850</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Transactions Feed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son İşlem Kayıtları</Text>
            <Text style={styles.recordCount}>{transactions.length} Kayıt</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#6366f1" style={{ marginVertical: 30 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <CreditCard size={32} color="#475569" />
              <Text style={styles.emptyText}>Henüz işlenmiş bir harcama bulunmuyor.</Text>
              <Text style={styles.emptySubText}>Yukarıdaki AI kutusuna ilk harcamanızı yazabilirsiniz!</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((t, index) => {
              const parsed = t.parsedData || t;
              const isIncome = parsed.intent === 'INCOME';

              return (
                <View key={t.id || index} style={styles.txRow}>
                  <View style={[styles.txIconContainer, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                    {isIncome ? <ArrowDownLeft size={18} color="#34d399" /> : <CreditCard size={18} color="#818cf8" />}
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txTitle}>{parsed.merchantOrTitle || 'İşlem'}</Text>
                    <View style={styles.txMetaRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>{parsed.category || 'Diğer'}</Text>
                      </View>
                      <Text style={styles.txMetaDate}>
                        {parsed.transactionDate?.split('T')[0] || 'Bugün'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txAmount, isIncome ? styles.incomeText : styles.expenseText]}>
                      {isIncome ? '+' : '-'}₺{Number(parsed.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.processedBadge}>
                      <CheckCircle2 size={10} color="#34d399" />
                      <Text style={styles.processedText}>İşlendi</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // Slate-950
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  headerLeft: {
    gap: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 2,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.6,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#6366f1',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34d399',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  subLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
  },
  expenseValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fb7185',
  },
  quickCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 22,
  },
  quickCardHeader: {
    marginBottom: 12,
  },
  quickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  quickCardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#030712',
    borderRadius: 16,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  presetChipIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  presetIncomeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipExpense: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  presetExpenseText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
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
    color: '#ffffff',
  },
  recordCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  txIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIconIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  txIconExpense: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  categoryPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  txMetaDate: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  incomeText: {
    color: '#34d399',
  },
  expenseText: {
    color: '#fb7185',
  },
  processedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  processedText: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: '700',
  },
});
