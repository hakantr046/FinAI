import { fetchWithAuth } from '@/lib/apiClient';
import type { InvoiceItem } from '@/types/invoice';

export interface InvoiceSummary {
  invoices: InvoiceItem[];
  totalVat: number;
  totalAmount: number;
}

export async function getInvoices(userId: string): Promise<InvoiceSummary> {
  const res = await fetchWithAuth(`/api/invoices/${userId}`);
  const data = await res.json();
  if (!Array.isArray(data?.invoices)) {
    return { invoices: [], totalVat: 0, totalAmount: 0 };
  }
  return {
    invoices: data.invoices,
    totalVat: data.totalVat || 0,
    totalAmount: data.totalAmount || 0,
  };
}

export interface CreateInvoicePayload {
  userId: string;
  clientName: string;
  amountBeforeVat: number;
  vatRatePercent: number;
  description: string;
  isPaid: boolean;
  issueDate: string;
  dueDate: string;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<void> {
  const res = await fetchWithAuth('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Fatura kaydedilemedi.');
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/invoices/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('Fatura silinemedi.');
  }
}
