'use client';

import React from 'react';
import { Shield, ShieldAlert, Pencil, Trash2 } from 'lucide-react';
import type { UserDetail } from '@/types/admin';

interface UsersTableProps {
  usersList: UserDetail[];
  currentUserEmail: string;
  actionLoading: string | null;
  onEdit: (user: UserDetail) => void;
  onToggleAdmin: (userId: string) => void;
  onDelete: (userId: string, userEmail: string) => void;
}

export default function UsersTable({ usersList, currentUserEmail, actionLoading, onEdit, onToggleAdmin, onDelete }: UsersTableProps) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sistem Kullanıcıları Yönetimi</h2>
        <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
          {usersList.length} Adet Kayıtlı Üye
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 font-bold">Kullanıcı Bilgileri</th>
              <th className="p-4 font-bold">Kayıt Tarihi</th>
              <th className="p-4 text-center font-bold">İşlemler</th>
              <th className="p-4 text-center font-bold">Bütçeler</th>
              <th className="p-4 text-center font-bold">Rol Yetkisi</th>
              <th className="p-4 text-right font-bold">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {usersList.map((usr) => (
              <tr key={usr.id} className="table-row-hover transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-white">{usr.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{usr.email}</div>
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                  {new Date(usr.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="p-4 text-center font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {usr.transactionsCount} adet
                </td>
                <td className="p-4 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {usr.activeBudgetsCount} limit
                </td>
                <td className="p-4 text-center">
                  {usr.isAdmin ? (
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Yönetici
                    </span>
                  ) : (
                    <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      Kullanıcı
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    <button
                      onClick={() => onEdit(usr)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer"
                      title="Kullanıcı Bilgilerini Düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleAdmin(usr.id)}
                      disabled={actionLoading === usr.id || usr.email === currentUserEmail}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        usr.isAdmin
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                      title={usr.isAdmin ? 'Yöneticilik Yetkisini Geri Al' : 'Yönetici Yap'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(usr.id, usr.email)}
                      disabled={actionLoading === usr.id || usr.email === currentUserEmail}
                      className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-2 rounded-xl hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Kullanıcıyı ve Verilerini Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
