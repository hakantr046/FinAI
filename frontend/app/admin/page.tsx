'use client';

import React, { useState } from 'react';
import { Shield, Plus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import * as advisorService from '@/lib/services/advisorService';
import AppLayout from '@/components/AppLayout';
import ThemeToggleButton from '@/components/shared/ThemeToggleButton';
import ChatWidget from '@/components/shared/ChatWidget';
import AdminStatsGrid from '@/components/admin/AdminStatsGrid';
import UsersTable from '@/components/admin/UsersTable';
import UserFormModal from '@/components/admin/UserFormModal';
import type { UserDetail } from '@/types/admin';
import type { ChatMessage } from '@/types/chat';

export default function AdminPage() {
  const { user: currentUser, isReady } = useSession({ requireAdmin: true });
  const { stats, usersList, loading, actionLoading, handleToggleAdmin, handleDeleteUser, handleCreateUser, handleUpdateUser } =
    useAdminDashboard(currentUser?.email);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', content: 'Merhaba! Ben FinAI Finansal Asistanınız. Sistem yönetimi veya kullanıcı bütçeleri hakkında benden öneri almak ister misiniz?' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const data = await advisorService.sendChatMessage({
        userId: currentUser.id,
        message: userMsg,
        history: chatHistory.slice(1),
        contextJson: stats ? JSON.stringify(stats) : '',
      });
      setChatHistory((prev) => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: 'model', content: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!isReady || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 text-sm font-bold">Yönetici yetkileri doğrulanıyor...</span>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Yönetici Paneli
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Sistem metriklerini, üyeleri yönetin ve yeni kullanıcı yetkilendirmesi yapın
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleButton variant="lg" />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kullanıcı Ekle</span>
          </button>

          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
            Admin: {currentUser.name}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <AdminStatsGrid stats={stats} />
          <UsersTable
            usersList={usersList}
            currentUserEmail={currentUser.email}
            actionLoading={actionLoading}
            onEdit={setEditingUser}
            onToggleAdmin={handleToggleAdmin}
            onDelete={handleDeleteUser}
          />
        </>
      )}

      {isAddModalOpen && (
        <UserFormModal
          mode="add"
          submitting={submitting}
          onClose={() => setIsAddModalOpen(false)}
          onSubmitAdd={async (payload) => {
            setSubmitting(true);
            try {
              await handleCreateUser(payload, () => setIsAddModalOpen(false));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {editingUser && (
        <UserFormModal
          mode="edit"
          initialUser={editingUser}
          submitting={submitting}
          onClose={() => setEditingUser(null)}
          onSubmitEdit={async (payload) => {
            setSubmitting(true);
            try {
              await handleUpdateUser(editingUser.id, payload, () => setEditingUser(null));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      <ChatWidget
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        history={chatHistory}
        message={chatMessage}
        onMessageChange={setChatMessage}
        onSubmit={handleSendChatMessage}
        loading={chatLoading}
        subtitle="Gemini 2.5 Flash ile Güçlendirildi"
        placeholder="Sistem yönetimi hakkında öneri iste..."
        closedLabel="Yapay Zeka Asistanı"
      />
    </AppLayout>
  );
}
