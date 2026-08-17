import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, TextInput, Alert 
} from 'react-native';
import { Target, Plus, Sparkles, TrendingUp, CircleDollarSign } from 'lucide-react-native';
import { fetchApi, UserSession } from '../services/api';

export default function GoalsScreen({ user }: { user: UserSession }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Goal State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGoals = async () => {
    try {
      const res = await fetchApi(`/api/goals/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreateGoal = async () => {
    if (!title || !targetAmount) {
      Alert.alert('Eksik Bilgi', 'Hedef adı ve hedef tutarı giriniz.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          title,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount || '0'),
          deadline: new Date(Date.now() + 180 * 86400000).toISOString(),
          category: 'Birikim',
        }),
      });

      if (!res.ok) throw new Error('Hedef eklenemedi.');

      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setShowAddForm(false);
      loadGoals();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Hedef oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (goalId: string) => {
    Alert.prompt(
      'Birikim Ekle',
      'Bu hedefe ne kadar eklemek istersiniz (₺)?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async (val) => {
            if (!val || isNaN(parseFloat(val))) return;
            try {
              const res = await fetchApi(`/api/goals/${goalId}/deposit`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(val) }),
              });
              if (res.ok) {
                loadGoals();
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
      'plain-text',
      '1000'
    );
  };

  const handleAiProjection = async (goalId: string) => {
    try {
      const res = await fetchApi(`/api/goals/${goalId}/ai-projection`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          '✨ Gemini AI Hedef Projeksiyonu',
          `Tahmini Ulaşma Tarihi: ${data.estimatedCompletionDate}\nÖnerilen Aylık Birikim: ₺${data.recommendedMonthlySaving?.toLocaleString('tr-TR')}\n\nTavsiye: ${data.adviceText}`
        );
      }
    } catch (e) {
      Alert.alert('Hata', 'AI analizi alınamadı.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Target size={24} color="#818cf8" />
          <Text style={styles.headerTitle}>Finansal Hedefler</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGoals(); }} colors={['#6366f1']} tintColor="#6366f1" />}
      >
        {/* Add Goal Modal / Inline Card */}
        {showAddForm && (
          <View style={styles.addCard}>
            <Text style={styles.addCardTitle}>Yeni Hedef Tanımla</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Hedef Adı (Örn: Ev Peşinatı)"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Hedef Tutar (₺)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mevcut Birikim (₺)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={currentAmount}
                onChangeText={setCurrentAmount}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && styles.btnDisabled]} 
              onPress={handleCreateGoal}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Hedefi Kaydet</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Goal Cards */}
        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 30 }} />
        ) : goals.length === 0 ? (
          <Text style={styles.emptyText}>Henüz kaydedilmiş finansal hedefiniz bulunmuyor.</Text>
        ) : (
          goals.map((g) => {
            const pct = Math.min(100, Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100));

            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalPct}>%{pct}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${pct}%` }]} />
                </View>

                <View style={styles.goalMetaRow}>
                  <Text style={styles.goalMeta}>Biriken: ₺{g.currentAmount?.toLocaleString('tr-TR')}</Text>
                  <Text style={styles.goalMeta}>Hedef: ₺{g.targetAmount?.toLocaleString('tr-TR')}</Text>
                </View>

                {/* Card Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeposit(g.id)}>
                    <CircleDollarSign size={16} color="#10b981" />
                    <Text style={styles.actionBtnText}>Birikim Ekle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionBtn, styles.aiBtn]} onPress={() => handleAiProjection(g.id)}>
                    <Sparkles size={16} color="#c084fc" />
                    <Text style={[styles.actionBtnText, { color: '#c084fc' }]}>AI Projeksiyon</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  addCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    height: 44,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 30,
  },
  goalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  goalPct: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#818cf8',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  goalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  aiBtn: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
});
