'use client';

import { useState } from 'react';
import {
  getRecurringItems,
  detectSubscriptions,
  createRecurringItem,
  deleteRecurringItem,
} from '@/lib/services/recurringService';
import type { RecurringItem } from '@/types/recurring';

export function useRecurringItems() {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual Creation Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Eğlence');
  const [frequency, setFrequency] = useState('Monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecurringItems = (userId: string) => {
    setLoading(true);
    getRecurringItems(userId)
      .then((data) => {
        setItems(data.items);
        setMonthlyTotal(data.monthlyTotal);
      })
      .catch((err) => console.error('Abonelikler çekilemedi:', err))
      .finally(() => setLoading(false));
  };

  const handleDetectSubscriptions = async (userId: string) => {
    setDetecting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await detectSubscriptions(userId);
      setSuccessMessage(data.message || 'Abonelikler başarıyla analiz edildi!');
      fetchRecurringItems(userId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Yapay zeka tespiti sırasında hata oluştu.');
    } finally {
      setDetecting(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!merchantName || !amount) return;

    setSubmitting(true);
    setError(null);

    try {
      await createRecurringItem({
        userId,
        merchantName,
        amount: parseFloat(amount),
        category,
        frequency,
        nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : new Date().toISOString(),
        isActive: true,
      });

      setIsModalOpen(false);
      setMerchantName('');
      setAmount('');
      fetchRecurringItems(userId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kaydetme hatası.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, userId: string) => {
    if (!confirm('Bu abonelik kaydını silmek istediğinize emin misiniz?')) return;

    try {
      await deleteRecurringItem(id);
      fetchRecurringItems(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Silme hatası oluştu.');
    }
  };

  return {
    items,
    monthlyTotal,
    loading,
    detecting,
    error,
    successMessage,
    fetchRecurringItems,
    handleDetectSubscriptions,
    handleDeleteItem,
    isModalOpen,
    setIsModalOpen,
    merchantName,
    setMerchantName,
    amount,
    setAmount,
    category,
    setCategory,
    frequency,
    setFrequency,
    nextDueDate,
    setNextDueDate,
    submitting,
    handleCreateSubscription,
  };
}
