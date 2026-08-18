'use client';

import { useState } from 'react';
import { importCsv } from '@/lib/services/transactionService';

export function useCsvImport(onImported: (userId: string) => void) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDateCol, setCsvDateCol] = useState('Tarih');
  const [csvDescCol, setCsvDescCol] = useState('Açıklama');
  const [csvAmtCol, setCsvAmtCol] = useState('Tutar');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);
  const [csvErrorMessage, setCsvErrorMessage] = useState<string | null>(null);

  const handleCsvSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvLoading(true);
    setCsvSuccessMessage(null);
    setCsvErrorMessage(null);

    try {
      const data = await importCsv({
        userId,
        file: csvFile,
        dateColumn: csvDateCol,
        descriptionColumn: csvDescCol,
        amountColumn: csvAmtCol,
      });

      setCsvSuccessMessage(data.message || 'Harcamalar başarıyla yüklendi.');
      setCsvFile(null);
      onImported(userId);
    } catch (err: any) {
      console.error(err);
      setCsvErrorMessage(err.message || 'CSV yüklenirken bir hata oluştu.');
    } finally {
      setCsvLoading(false);
    }
  };

  return {
    csvFile,
    setCsvFile,
    csvDateCol,
    setCsvDateCol,
    csvDescCol,
    setCsvDescCol,
    csvAmtCol,
    setCsvAmtCol,
    csvLoading,
    csvSuccessMessage,
    csvErrorMessage,
    handleCsvSubmit,
  };
}
