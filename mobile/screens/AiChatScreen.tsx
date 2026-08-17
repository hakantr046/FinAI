import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Bot, Send, Sparkles, ShieldCheck } from 'lucide-react-native';
import { fetchApi, UserSession } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatScreen({ user }: { user: UserSession }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Merhaba ${user.name}! Ben FinAI kişisel finans danışmanınızım. Canlı bütçeniz, hedefleriniz veya harcama alışkanlıklarınız hakkında benden öneri almak ister misiniz?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/#/g, '').trim();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const historyDto = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }));

      const res = await fetchApi('/api/advisor/chat', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          message: userMsg.content,
          history: historyDto,
          contextJson: JSON.stringify([]),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Yanıt alınamadı.');

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText(data.reply || 'Üzgünüm, yanıt oluşturulamadı.'),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botIcon}>
          <Sparkles size={20} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.aiBadgeRow}>
            <Text style={styles.title}>FinAI Danışmanı</Text>
            <View style={styles.onlineChip}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Çevrimiçi</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>RAG Destekli Canlı Bütçe Analisti</Text>
        </View>
      </View>

      {/* Messages Feed */}
      <ScrollView contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View 
            key={m.id} 
            style={[
              styles.msgWrapper, 
              m.role === 'user' ? styles.userMsgWrapper : styles.botMsgWrapper
            ]}
          >
            {m.role === 'assistant' && (
              <View style={styles.avatarBot}>
                <Bot size={14} color="#ffffff" />
              </View>
            )}
            <View 
              style={[
                styles.msgBubble, 
                m.role === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={[styles.msgText, m.role === 'user' && { color: '#ffffff' }]}>
                {cleanText(m.content)}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.msgWrapper, styles.botMsgWrapper]}>
            <View style={styles.avatarBot}>
              <Bot size={14} color="#ffffff" />
            </View>
            <View style={styles.botBubble}>
              <ActivityIndicator color="#818cf8" size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Tasarruf veya bütçeniz hakkında soru sorun..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={loading} activeOpacity={0.8}>
          <Send size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // Slate-950
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  botIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34d399',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userMsgWrapper: {
    justifyContent: 'flex-end',
  },
  botMsgWrapper: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  botBubble: {
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  msgText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#030712',
    borderRadius: 16,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sendBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});
