// `value` must match the short category codes the AI/backend services assign to
// transactions (src/ai_service/server.py) — only `label` is for display. Using the
// long label as the value here would desync budget/transaction category matching.
export const TRANSACTION_CATEGORIES = [
  { value: 'Gıda/Market', label: 'Gıda/Market' },
  { value: 'Ulaşım', label: 'Ulaşım & Benzin' },
  { value: 'Eğlence', label: 'Eğlence & Sosyal' },
  { value: 'Fatura', label: 'Fatura & Aidat' },
  { value: 'Giyim', label: 'Giyim & Moda' },
  { value: 'Teknoloji', label: 'Teknoloji & Dijital' },
  { value: 'Sağlık', label: 'Sağlık & Medikal' },
  { value: 'Diğer', label: 'Diğer' },
] as const;

export const GOAL_CATEGORIES = ['Birikim', 'Tatil', 'Ev/Araba', 'Acil Durum', 'Diğer'] as const;

export const VAT_RATES = [1, 10, 20] as const;

export const RECURRING_FREQUENCIES = [
  { value: 'Monthly', label: 'Aylık' },
  { value: 'Weekly', label: 'Haftalık' },
  { value: 'Yearly', label: 'Yıllık' },
] as const;

export function getFrequencyLabel(frequency: string): string {
  return RECURRING_FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}
