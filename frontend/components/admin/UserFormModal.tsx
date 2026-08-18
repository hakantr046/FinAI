'use client';

import React, { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import type { UserDetail } from '@/types/admin';
import type { CreateUserPayload, UpdateUserPayload } from '@/lib/services/adminService';

interface UserFormModalProps {
  mode: 'add' | 'edit';
  initialUser?: UserDetail;
  submitting: boolean;
  onClose: () => void;
  onSubmitAdd?: (payload: CreateUserPayload) => Promise<void>;
  onSubmitEdit?: (payload: UpdateUserPayload) => Promise<void>;
}

export default function UserFormModal({ mode, initialUser, submitting, onClose, onSubmitAdd, onSubmitEdit }: UserFormModalProps) {
  const [name, setName] = useState(initialUser?.name ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(initialUser?.isAdmin ?? false);

  const isEdit = mode === 'edit';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      if (!name.trim() || !email.trim()) return;
      await onSubmitEdit?.({ name: name.trim(), email: email.trim(), password: password.trim() ? password : null, isAdmin });
    } else {
      if (!name.trim() || !email.trim() || !password.trim()) return;
      await onSubmitAdd?.({ name: name.trim(), email: email.trim(), password, isAdmin });
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
      icon={isEdit ? Pencil : Plus}
      showCloseButton
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ad Soyad</label>
          <input
            type="text"
            required
            placeholder="Ahmet Yılmaz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-posta Adresi</label>
          <input
            type="email"
            required
            placeholder="ahmet@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {isEdit ? (
              <>
                Yeni Parola <span className="text-[10px] text-slate-400 font-normal">(Boş bırakılırsa değişmez)</span>
              </>
            ) : (
              'Parola'
            )}
          </label>
          <input
            type="password"
            required={!isEdit}
            placeholder={isEdit ? 'Yeni parola belirlemek için doldurun' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full input-light rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isAdminCheckbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isAdminCheckbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            {isEdit ? 'Yönetici (Admin) Rolüne Sahip' : 'Yönetici (Admin) Yetkisi Ver'}
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (isEdit ? 'Kaydediliyor...' : 'Oluşturuluyor...') : isEdit ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Ekle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
