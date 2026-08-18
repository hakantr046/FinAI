import { fetchWithAuth, API_BASE_URL } from '@/lib/apiClient';
import type { TransactionRecord } from '@/types/transaction';

export async function getTransactions(userId: string, range: string = 'all'): Promise<TransactionRecord[]> {
  const query = range ? `?range=${range}` : '';
  const res = await fetchWithAuth(`/api/transactions/${userId}${query}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export interface ParseTransactionPayload {
  userId: string;
  inputText: string;
  dateStr: string;
}

export async function parseTransaction(payload: ParseTransactionPayload): Promise<TransactionRecord> {
  const res = await fetchWithAuth('/api/parse-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Backend ile iletişim kurulurken bir hata oluştu.');
  }
  return res.json();
}

export interface UpdateTransactionPayload {
  amount: number;
  category: string;
  merchantOrTitle: string;
  intent: string;
  transactionDate: string;
}

export async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<void> {
  const res = await fetchWithAuth(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('İşlem güncellenemedi.');
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/transactions/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('İşlem silinemedi.');
  }
}

export interface ImportCsvPayload {
  userId: string;
  file: File;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
}

export async function importCsv(payload: ImportCsvPayload): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('userId', payload.userId);
  formData.append('dateColumn', payload.dateColumn);
  formData.append('descriptionColumn', payload.descriptionColumn);
  formData.append('amountColumn', payload.amountColumn);

  const res = await fetchWithAuth('/api/transactions/import', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'CSV aktarımı başarısız oldu.');
  }
  return data;
}

export function buildExportUrl(userId: string, format: 'excel' | 'pdf', range: string): string {
  return `${API_BASE_URL}/api/reports/export?userId=${userId}&format=${format}&range=${range}`;
}
