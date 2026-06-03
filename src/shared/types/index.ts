// ============================================================
// Tipos principais — mantém compatibilidade com interfaces antigas
// Importação via @shared/types continua funcionando
// ============================================================

export type PaymentType = 'cash' | 'pix' | 'credit_card' | 'debit_card';
export type SaleStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type StockMovementType = 'in' | 'out' | 'initial' | 'adjustment';
export type SaleSyncStatus = 'pending' | 'synced' | 'failed';
export type SaleItemStatus = 'active' | 'cancelled';
export type InstallmentType = 'normal' | 'entry';

export interface InstallmentHistory {
  date: string;
  status: InstallmentStatus;
  notes?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  averageCost: number;
  unit?: string | null;
  photoUri?: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costAtSale?: number | null;
  profitAmount?: number | null;
  status?: SaleItemStatus | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  website?: string | null;
  pix?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  saleId: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: InstallmentStatus;
  history: InstallmentHistory[];
  type: InstallmentType;
}

export interface Sale {
  id: string;
  clientId?: string | null;
  clientName?: string | null;
  description?: string | null;
  items: SaleItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue: number;
  totalAmount: number;
  entryAmount?: number | null;
  entryPaymentType?: PaymentType | null;
  paymentType: PaymentType;
  status: SaleStatus;
  installmentsCount: number;
  installments: Installment[];
  tagIds: string[];
  saleDate: string;
  firstInstallmentDate?: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus?: SaleSyncStatus | null;
  syncError?: string | null;
  syncWarnings?: Array<{ productId: string; productName: string; available: number; quantity: number }> | null;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: string;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface MonthSummary {
  year: number;
  month: number;
  totalSales: number;
  totalReceived: number;
  totalPending: number;
  salesCount: number;
}

export interface SummaryItem {
  id: string;
  type: 'sale' | 'installment';
  saleId: string;
  title: string;
  description?: string | null;
  clientName?: string | null;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
  paymentType: string;
  tagIds: string[];
  installmentInfo?: {
    number: number;
    total: number;
    isEntry?: boolean;
    entryPaymentType?: string | null;
  } | null;
  syncStatus?: string | null;
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  paymentType?: string;
  status?: string;
  tagIds?: string[];
  searchText?: string;
}

export interface ReportData {
  period: { start: string; end: string };
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
  salesCount: number;
  byPaymentType: Record<string, number>;
  byMonth: Array<{ month: string; revenue: number; received: number }>;
}

export interface AppSettings {
  askReturnStockOnDelete: boolean;
}
