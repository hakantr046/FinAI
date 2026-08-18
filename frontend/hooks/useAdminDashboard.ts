'use client';

import { useEffect, useState } from 'react';
import * as adminService from '@/lib/services/adminService';
import type { SystemStats, UserDetail } from '@/types/admin';
import type { CreateUserPayload, UpdateUserPayload } from '@/lib/services/adminService';

export function useAdminDashboard(currentUserEmail: string | undefined) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([adminService.getStats(), adminService.getUsers()]);
      setStats(statsData);
      setUsersList(usersData);
    } catch (err) {
      console.error('Veriler yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserEmail) {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail]);

  const handleToggleAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminService.toggleAdmin(userId);
      await loadAdminData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Rol değiştirilirken bir ağ hatası oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUserEmail) {
      alert('Kendinizi silemezsiniz!');
      return;
    }
    if (!confirm(`"${userEmail}" kullanıcısını ve ilişkili TÜM verilerini silmek istediğinize emin misiniz?`)) return;

    setActionLoading(userId);
    try {
      await adminService.deleteUser(userId);
      await loadAdminData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Kullanıcı silinirken bir hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (payload: CreateUserPayload, onSuccess: () => void) => {
    try {
      await adminService.createUser(payload);
      onSuccess();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Kullanıcı oluşturulamadı.');
    }
  };

  const handleUpdateUser = async (userId: string, payload: UpdateUserPayload, onSuccess: () => void) => {
    try {
      await adminService.updateUser(userId, payload);
      onSuccess();
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Güncelleme hatası oluştu.');
    }
  };

  return {
    stats,
    usersList,
    loading,
    actionLoading,
    handleToggleAdmin,
    handleDeleteUser,
    handleCreateUser,
    handleUpdateUser,
  };
}
