export interface ParsedReceiptItem {
  name: string;
  price: number;
}

export interface ReceiptResult {
  receiptId: string;
  merchantName: string;
  totalAmount: number;
  category: string;
  dateStr: string;
  itemsJson: string;
  confidenceScore: number;
}

export interface ReceiptHistoryItem {
  id: string;
  merchantName: string;
  totalAmount: number;
  category: string;
  status: string;
  confidenceScore: number;
  createdAt: string;
}
