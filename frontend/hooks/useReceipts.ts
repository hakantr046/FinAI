'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getReceiptHistory, uploadReceipt, confirmReceipt } from '@/lib/services/receiptService';
import type { ParsedReceiptItem, ReceiptResult, ReceiptHistoryItem } from '@/types/receipt';

export function useReceipts(userId: string | undefined) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [parsedResult, setParsedResult] = useState<ReceiptResult | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Diğer');
  const [editDate, setEditDate] = useState('');
  const [confirming, setConfirming] = useState(false);

  const [history, setHistory] = useState<ReceiptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = (uid: string) => {
    setHistoryLoading(true);
    getReceiptHistory(uid)
      .then((data) => setHistory(data))
      .catch((err) => console.error('Fiş geçmişi çekilemedi:', err))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (userId) {
      fetchHistory(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setParsedResult(null);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !file) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await uploadReceipt(userId, file);

      setParsedResult(data);
      setEditMerchant(data.merchantName || 'Bilinmeyen');
      setEditAmount(data.totalAmount?.toString() || '0');
      setEditCategory(data.category || 'Diğer');
      setEditDate(data.dateStr || new Date().toISOString().split('T')[0]);

      fetchHistory(userId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fiş yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!userId || !parsedResult) return;

    setConfirming(true);
    setError(null);

    try {
      await confirmReceipt(parsedResult.receiptId, {
        merchantName: editMerchant,
        amount: parseFloat(editAmount),
        category: editCategory,
        transactionDate: new Date(editDate).toISOString(),
      });

      setSuccessMessage('Fiş başarıyla harcama işlemleri listenize eklendi! Panele yönlendiriliyorsunuz...');
      setParsedResult(null);
      setFile(null);
      setPreviewUrl(null);
      fetchHistory(userId);
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fiş onaylanırken hata oluştu.');
    } finally {
      setConfirming(false);
    }
  };

  const itemsList: ParsedReceiptItem[] = useMemo(() => {
    if (!parsedResult?.itemsJson) return [];
    try {
      return JSON.parse(parsedResult.itemsJson);
    } catch {
      return [];
    }
  }, [parsedResult?.itemsJson]);

  return {
    file,
    previewUrl,
    uploading,
    error,
    successMessage,
    parsedResult,
    editMerchant,
    setEditMerchant,
    editAmount,
    setEditAmount,
    editCategory,
    setEditCategory,
    editDate,
    setEditDate,
    confirming,
    history,
    historyLoading,
    itemsList,
    handleFileSelect,
    handleUploadSubmit,
    handleConfirmReceipt,
  };
}
