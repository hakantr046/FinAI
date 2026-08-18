'use client';

import { useState } from 'react';
import { sendChatMessage } from '@/lib/services/advisorService';
import type { ChatMessage } from '@/types/chat';

export function useAdvisorChat(userId: string | undefined, contextJson: () => string, greeting: string) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{ role: 'model', content: greeting }]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const data = await sendChatMessage({
        userId,
        message: userMsg,
        history: chatHistory.slice(1),
        contextJson: contextJson(),
      });
      setChatHistory((prev) => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: 'model', content: 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    chatMessage,
    setChatMessage,
    chatHistory,
    chatLoading,
    handleSendChatMessage,
  };
}
