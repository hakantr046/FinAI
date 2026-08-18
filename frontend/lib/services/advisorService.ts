import { fetchWithAuth } from '@/lib/apiClient';
import { extractErrorMessage } from './httpErrors';
import type { ChatMessage } from '@/types/chat';

export interface SendChatMessagePayload {
  userId: string;
  message: string;
  history: ChatMessage[];
  contextJson: string;
}

export async function sendChatMessage(payload: SendChatMessagePayload): Promise<{ reply: string }> {
  const res = await fetchWithAuth('/api/advisor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Asistan yanıt veremedi.'));
  }
  return res.json();
}
