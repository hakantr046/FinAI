'use client';

import { useState } from 'react';
import { getInvoices, createInvoice, deleteInvoice } from '@/lib/services/invoiceService';
import type { InvoiceItem } from '@/types/invoice';

export function useInvoices(userId: string | undefined) {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalVatSum, setTotalVatSum] = useState(0);
  const [totalInvoiceSum, setTotalInvoiceSum] = useState(0);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invVatRate, setInvVatRate] = useState<number>(20);
  const [invDescription, setInvDescription] = useState('');
  const [invIsPaid, setInvIsPaid] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const fetchInvoices = (uid: string) => {
    setLoadingInvoices(true);
    getInvoices(uid)
      .then((data) => {
        setInvoices(data.invoices);
        setTotalVatSum(data.totalVat);
        setTotalInvoiceSum(data.totalAmount);
      })
      .catch((err) => console.error('Faturalar çekilemedi:', err))
      .finally(() => setLoadingInvoices(false));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !clientName || !invAmount) return;

    setSubmittingInvoice(true);
    try {
      await createInvoice({
        userId,
        clientName,
        amountBeforeVat: parseFloat(invAmount),
        vatRatePercent: invVatRate,
        description: invDescription,
        isPaid: invIsPaid,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setIsInvoiceModalOpen(false);
      setClientName('');
      setInvAmount('');
      setInvDescription('');
      fetchInvoices(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Fatura kaydetme hatası.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!userId || !confirm('Bu fatura kaydını silmek istediğinize emin misiniz?')) return;

    try {
      await deleteInvoice(id);
      fetchInvoices(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return {
    invoices,
    totalVatSum,
    totalInvoiceSum,
    loadingInvoices,
    fetchInvoices,
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    clientName,
    setClientName,
    invAmount,
    setInvAmount,
    invVatRate,
    setInvVatRate,
    invDescription,
    setInvDescription,
    invIsPaid,
    setInvIsPaid,
    submittingInvoice,
    handleCreateInvoice,
    handleDeleteInvoice,
  };
}
