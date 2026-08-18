'use client';

import { useState } from 'react';
import {
  getTransactions,
  parseTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/services/transactionService';
import type { TransactionRecord } from '@/types/transaction';

export function useTransactions(onMutated?: (userId: string) => void) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('all');

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Diğer');
  const [editMerchant, setEditMerchant] = useState('');
  const [editIntent, setEditIntent] = useState('EXPENSE');
  const [editDate, setEditDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchTransactions = (userId: string, range: string = dateRange) => {
    setTxLoading(true);
    getTransactions(userId, range)
      .then(setTransactions)
      .catch((err) => console.error('Geçmiş veriler çekilemedi:', err))
      .finally(() => setTxLoading(false));
  };

  const handleRangeChange = (newRange: string, userId: string) => {
    setDateRange(newRange);
    fetchTransactions(userId, newRange);
  };

  const handleSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseTransaction({
        userId,
        inputText,
        dateStr: new Date().toISOString(),
      });
      setTransactions((prev) => [data, ...prev]);
      setInputText('');
      onMutated?.(userId);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string, userId: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteTransaction(id);
      fetchTransactions(userId);
      onMutated?.(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'İşlem silinirken bir hata oluştu.');
    }
  };

  const handleStartEdit = (tx: TransactionRecord) => {
    setEditingTx(tx);
    setEditAmount(tx.parsedData.amount.toString());
    setEditCategory(tx.parsedData.category);
    setEditMerchant(tx.parsedData.merchantOrTitle);
    setEditIntent(tx.parsedData.intent || 'EXPENSE');
    setEditDate(tx.parsedData.transactionDate || new Date().toISOString().split('T')[0]);
  };

  const handleUpdateTransaction = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!editingTx) return;

    setEditLoading(true);
    try {
      await updateTransaction(editingTx.transactionId, {
        amount: parseFloat(editAmount),
        category: editCategory,
        merchantOrTitle: editMerchant,
        intent: editIntent,
        transactionDate: new Date(editDate).toISOString(),
      });
      setEditingTx(null);
      fetchTransactions(userId);
      onMutated?.(userId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'İşlem güncellenirken bir hata oluştu.');
    } finally {
      setEditLoading(false);
    }
  };

  return {
    transactions,
    setTransactions,
    txLoading,
    dateRange,
    fetchTransactions,
    handleRangeChange,
    inputText,
    setInputText,
    loading,
    error,
    handleSubmit,
    handleDeleteTransaction,
    editingTx,
    setEditingTx,
    editAmount,
    setEditAmount,
    editCategory,
    setEditCategory,
    editMerchant,
    setEditMerchant,
    editIntent,
    setEditIntent,
    editDate,
    setEditDate,
    editLoading,
    handleStartEdit,
    handleUpdateTransaction,
  };
}
