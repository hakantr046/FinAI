'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  Sparkles, 
  CheckCheck, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Clock, 
  ShieldAlert
} from 'lucide-react';
import { fetchWithAuth, logout } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { Sun, Moon } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'anomaly'>('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchNotifications(parsed.id);
      } catch (e) {
        logout();
      }
    }
  }, [router]);

  const fetchNotifications = (userId: string) => {
    setLoading(true);
    fetchWithAuth(`/api/notifications/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch((err) => console.error('Bildirimler çekilemedi:', err))
      .finally(() => setLoading(false));
  };

  const handleScanAnomalies = async () => {
    if (!user) return;
    setScanning(true);

    try {
      const response = await fetchWithAuth('/api/notifications/detect-anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Anomali taraması başarısız.');
      }

      fetchNotifications(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Anomali taraması hatası.');
    } finally {
      setScanning(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await fetchWithAuth(`/api/notifications/read-all/${user.id}`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'anomaly') return n.type === 'ANOMALY';
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'ANOMALY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'BUDGET_WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

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
              Bildirimler
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Anomali uyarıları, bütçe aşım ikazları ve sistem duyuruları.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title={isDarkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={handleScanAnomalies}
            disabled={scanning}
            className="btn-gradient px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {scanning ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Yapay Zeka ile Tara</span>
              </>
            )}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[var(--primary)]" />
              <span>Tümünü Okundu İşaretle ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-card rounded-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-[7px] rounded-full text-[12.5px] font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            Tümü ({notifications.length})
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-[7px] rounded-full text-[12.5px] font-semibold transition-colors cursor-pointer ${
              filter === 'unread'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            Okunmamış ({unreadCount})
          </button>

          <button
            onClick={() => setFilter('anomaly')}
            className={`px-3.5 py-[7px] rounded-full text-[12.5px] font-semibold transition-colors cursor-pointer ${
              filter === 'anomaly'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            Anomali ({notifications.filter((n) => n.type === 'ANOMALY').length})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Bildirimler yükleniyor...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto opacity-30 text-emerald-500" />
            <p>Seçilen filtrede henüz bildirim bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors flex items-start justify-between gap-4 ${
                  !notification.isRead
                    ? 'bg-[var(--accent-soft)] border-slate-200 dark:border-slate-700'
                    : 'bg-transparent border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {getIconForType(notification.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[13.5px] text-slate-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed my-1">
                      {notification.message}
                    </p>
                    <span className="text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs text-[var(--primary)] hover:underline font-semibold shrink-0 cursor-pointer"
                  >
                    Okundu İşaretle
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
