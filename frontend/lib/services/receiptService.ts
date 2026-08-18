import { fetchWithAuth } from '@/lib/apiClient';
import { extractErrorMessage } from './httpErrors';
import type { ReceiptResult, ReceiptHistoryItem } from '@/types/receipt';

export async function getReceiptHistory(userId: string): Promise<ReceiptHistoryItem[]> {
  const res = await fetchWithAuth(`/api/receipts/${userId}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function uploadReceipt(userId: string, file: File): Promise<ReceiptResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const res = await fetchWithAuth('/api/receipts/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Fiş analiz edilemedi.');
  }
  return data;
}

export interface ConfirmReceiptPayload {
  merchantName: string;
  amount: number;
  category: string;
  transactionDate: string;
}

export async function confirmReceipt(receiptId: string, payload: ConfirmReceiptPayload): Promise<void> {
  const res = await fetchWithAuth(`/api/receipts/${receiptId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Fiş onaylanamadı.'));
  }
}
