export interface InvoiceItem {
  id: string;
  clientName: string;
  amountBeforeVat: number;
  vatRatePercent: number;
  vatAmount: number;
  totalAmount: number;
  description: string;
  isPaid: boolean;
  issueDate: string;
  dueDate: string;
}
