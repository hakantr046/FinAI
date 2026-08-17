'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt as ReceiptIcon, 
  Repeat, 
  Bell, 
  Target, 
  Briefcase, 
  Shield, 
  LogOut 
} from 'lucide-react';
import { logout, fetchWithAuth } from '../lib/apiClient';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('finai_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Fetch unread notifications count
        fetchWithAuth(`/api/notifications/${parsed.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.unreadCount !== undefined) {
              setUnreadCount(data.unreadCount);
            }
          })
          .catch(() => {});
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Fiş Tarama (OCR)', path: '/receipts', icon: ReceiptIcon },
    { label: 'Abonelikler & Giderler', path: '/recurring', icon: Repeat },
    { label: 'Bildirim & Anomali', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Finansal Hedefler', path: '/goals', icon: Target },
    { label: 'Esnaf KDV & Aile Bütçesi', path: '/niche', icon: Briefcase },
  ];

  if (user?.isAdmin) {
    navItems.push({ label: 'Admin Paneli', path: '/admin', icon: Shield, badge: 0 });
  }

  const initials = (user?.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p.charAt(0).toUpperCase())
    .join('') || 'FA';

  return (
    <aside className="glass-sidebar w-64 fixed top-0 left-0 h-screen flex flex-col z-40 px-4 py-5">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-2 pb-5 border-b border-slate-200 dark:border-slate-700 mb-4">
        <div className="w-11 h-11 flex items-center justify-center shrink-0">
          <img src="/brand/finai-logo-icon.png" alt="FinAI" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">FinAI</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Finansal Kontrol Paneli</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`nav-item flex items-center justify-between ${isActive ? 'active' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-[17px] h-[17px]" />
                <span>{item.label}</span>
              </div>
              {item.badge ? item.badge > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full">
                  {item.badge}
                </span>
              ) : null : null}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="flex items-center gap-2.5 pt-4 mt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 bg-[var(--accent-soft)] text-[var(--primary)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
