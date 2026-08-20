import { fetchWithAuth } from '@/lib/apiClient';
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

// Rapor uç noktası artık kimlik doğrulama gerektiriyor (IDOR düzeltmesi), bu yüzden
// window.open(url) yerine (Authorization header taşıyamaz) fetchWithAuth ile
// Blob olarak çekip indiriyoruz. 'pdf' formatı backend'de aslında sayfa açılınca
// otomatik yazdırma çalıştıran bir HTML döner — o davranışı korumak için dosya
// olarak indirmek yerine yeni sekmede açılır; 'excel' gerçek bir dosya indirmesidir.
export async function exportReport(userId: string, format: 'excel' | 'pdf', range: string): Promise<void> {
  const res = await fetchWithAuth(`/api/reports/export?userId=${userId}&format=${format}&range=${range}`);
  if (!res.ok) {
    throw new Error('Rapor oluşturulamadı.');
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  if (format === 'pdf') {
    window.open(objectUrl, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `FinAI_Raporu_${range}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
