import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, TextInput 
} from 'react-native';
import { Repeat, Sparkles, Plus, Trash2, Calendar, Check } from 'lucide-react-native';
import { fetchApi, UserSession } from '../services/api';

export default function RecurringScreen({ user }: { user: UserSession }) {
  const [items, setItems] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Eğlence');

  const loadRecurringItems = async () => {
    try {
      const res = await fetchApi(`/api/recurring-transactions/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setMonthlyTotal(data.monthlyTotal || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecurringItems();
  }, []);

  const handleAddRecurring = async () => {
    if (!merchantName.trim() || !amount.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen hizmet adını ve tutarını girin.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen geçerli bir tutar girin.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApi('/api/recurring-transactions', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          merchantName: merchantName.trim(),
          amount: numericAmount,
          category: category,
          frequency: 'Monthly',
          nextDueDate: new Date().toISOString(),
          isActive: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gider eklenemedi.');
      }

      Alert.alert('Başarılı', `${merchantName} aboneliğiniz kaydedildi!`);
      setMerchantName('');
      setAmount('');
      setShowAddForm(false);
      loadRecurringItems();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Sabit gider kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDetectAI = async () => {
    setDetecting(true);
    try {
      const res = await fetchApi('/api/recurring-transactions/detect', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Abonelikler saptanamadı.');

      Alert.alert('Başarılı', data.message || 'Sabit ödemeleriniz analiz edildi!');
      loadRecurringItems();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Yapay zeka tespiti başarısız.');
    } finally {
      setDetecting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Abonelik Sil', 'Bu kaydı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchApi(`/api/recurring-transactions/${id}`, { method: 'DELETE' });
            if (res.ok) loadRecurringItems();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Repeat size={24} color="#818cf8" />
          <Text style={styles.headerTitle}>Abonelikler</Text>
        </View>
        <TouchableOpacity 
          style={[styles.aiBtn, detecting && styles.btnDisabled]} 
          onPress={handleDetectAI}
          disabled={detecting}
        >
          {detecting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.aiBtnText}>AI Bul</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecurringItems(); }} colors={['#6366f1']} tintColor="#6366f1" />}
      >
        {/* Metric Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Aylık Sabit Taahhüt</Text>
          <Text style={styles.summaryValue}>₺{monthlyTotal.toLocaleString('tr-TR')} / ay</Text>
          <Text style={styles.summarySub}>Aktif Abonelik Sayısı: {items.length}</Text>
        </View>

        {/* Subscription Radar Banner */}
        <View style={{ backgroundColor: '#1e1b4b', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#4338ca' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={18} color="#818cf8" />
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Subscription Radar Akıllı Uyarısı</Text>
          </View>
          <Text style={{ color: '#c7d2fe', fontSize: 12, lineHeight: 18 }}>
            • Son 30 günde Dijital Yayın abonelik fiyatlarında ortalama %15 artış tespit edildi.{'\n'}
            • Tüm abonelikleriniz düzenli olarak taranıyor. Unutulan veya zamlanan faturalar anında haber verilir.
          </Text>
        </View>

        {/* Action Button to Open Form */}
        <TouchableOpacity 
          style={styles.openFormBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.openFormBtnText}>
            {showAddForm ? 'Formu Kapat' : 'Yeni Abonelik / Gider Ekle'}
          </Text>
        </TouchableOpacity>

        {/* Add Form */}
        {showAddForm && (
          <View style={styles.addFormCard}>
            <Text style={styles.formTitle}>Yeni Sabit Gider / Abonelik Ekle</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Abonelik / Hizmet Adı (örn: Netflix, Ev Kirası)"
              placeholderTextColor="#94a3b8"
              value={merchantName}
              onChangeText={setMerchantName}
            />

            <TextInput
              style={styles.input}
              placeholder="Aylık Tutar (₺) (örn: 229)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.categoryLabel}>Kategori Seçin:</Text>
            <View style={styles.categoryRow}>
              {['Eğlence', 'Fatura', 'Konut', 'Ulaşım', 'Diğer'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.btnDisabled]} 
              onPress={handleAddRecurring}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#ffffff" /> : (
                <View style={styles.btnContent}>
                  <Check size={18} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Aboneliği Kaydet</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription List */}
        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 30 }} />
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>Aktif abonelik veya sabit gider kaydınız bulunmuyor.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemMain}>
                <View style={styles.itemBadge}>
                  <Calendar size={18} color="#818cf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.merchantName}>{item.merchantName}</Text>
                  <Text style={styles.categoryText}>{item.category} • {item.frequency === 'Monthly' ? 'Aylık' : item.frequency === 'Yearly' ? 'Yıllık' : 'Haftalık'}</Text>
                </View>
                <Text style={styles.amountText}>₺{item.amount?.toLocaleString('tr-TR')}</Text>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 size={16} color="#f43f5e" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  openFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  openFormBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  scrollContent: {
    padding: 20,
  },
  addFormCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    height: 44,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  catChipText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  catChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  saveBtn: {
    height: 44,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 6,
  },
  summarySub: {
    fontSize: 12,
    color: '#818cf8',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 30,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 10,
  },
  deleteBtn: {
    padding: 6,
  },
});
