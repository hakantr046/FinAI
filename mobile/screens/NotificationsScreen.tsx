import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { fetchApi, UserSession } from '../services/api';

export default function NotificationsScreen({ user }: { user: UserSession }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetchApi(`/api/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleReadAll = async () => {
    try {
      await fetchApi(`/api/notifications/read-all/${user.id}`, { method: 'POST' });
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color="#818cf8" />
          <Text style={styles.headerTitle}>Bildirim & Anomali</Text>
        </View>
        <TouchableOpacity style={styles.readAllBtn} onPress={handleReadAll}>
          <Text style={styles.readAllText}>Tümünü Okundu İşaretle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} colors={['#6366f1']} tintColor="#6366f1" />}
      >
        {loading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 30 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle size={40} color="#10b981" />
            <Text style={styles.emptyTitle}>Henüz Bildiriminiz Yok</Text>
            <Text style={styles.emptySub}>Bütçe limitleri ve anomali uyarıları burada görünecektir.</Text>
          </View>
        ) : (
          notifications.map((item) => {
            const isWarning = item.type === 'BUDGET_WARNING' || item.type === 'ANOMALY';
            return (
              <View 
                key={item.id} 
                style={[
                  styles.notifCard,
                  !item.isRead && styles.unreadCard
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: isWarning ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)' }]}>
                  {isWarning ? <AlertTriangle size={20} color="#f43f5e" /> : <Bell size={20} color="#818cf8" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifMsg}>{item.message}</Text>
                  <Text style={styles.notifDate}>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  readAllBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readAllText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#1e293b',
    borderRadius: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unreadCard: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1b4b',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notifMsg: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  notifDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 6,
  },
});
