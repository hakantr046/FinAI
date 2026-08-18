import { fetchWithAuth } from '@/lib/apiClient';
import { extractErrorMessage } from './httpErrors';
import type { SystemStats, UserDetail } from '@/types/admin';

export async function getStats(): Promise<SystemStats> {
  const res = await fetchWithAuth('/api/admin/stats');
  return res.json();
}

export async function getUsers(): Promise<UserDetail[]> {
  const res = await fetchWithAuth('/api/admin/users');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function toggleAdmin(userId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${userId}/toggle-admin`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Yetki güncellenemedi.'));
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Kullanıcı silinemedi.'));
  }
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export async function createUser(payload: CreateUserPayload): Promise<void> {
  const res = await fetchWithAuth('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Kullanıcı eklenemedi.'));
  }
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  password: string | null;
  isAdmin: boolean;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Kullanıcı güncellenemedi.'));
  }
}
