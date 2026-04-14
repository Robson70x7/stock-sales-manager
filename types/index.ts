// ============================================================
// Tipos principais do aplicativo VendaFácil
// ============================================================

export type PaymentType = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'installment';
export type SaleStatus = 'pending' | 'partial' | 'paid' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  unit?: string;
  photoUri?: string; // Base64 ou URI local da foto do produto
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  document?: string; // CPF ou CNPJ
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InstallmentHistory {
  date: string;
  status: InstallmentStatus;
  notes?: string;
}

export interface Installment {
  id: string;
  saleId: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: InstallmentStatus;
  history: InstallmentHistory[];
}

export interface Sale {
  id: string;
  clientId?: string;
  clientName?: string;
  description?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentType: PaymentType;
  status: SaleStatus;
  installmentsCount: number;
  installments: Installment[];
  tagIds: string[];
  saleDate: string;
  firstInstallmentDate: string; // Data da primeira parcela
  createdAt: string;
  updatedAt: string;
}

// Dados agregados para o resumo mensal
export interface MonthSummary {
  year: number;
  month: number; // 0-11
  totalSales: number;
  totalReceived: number;
  totalPending: number;
  salesCount: number;
}

// Item de resumo mensal (venda ou parcela)
export interface SummaryItem {
  id: string;
  type: 'sale' | 'installment';
  saleId: string;
  title: string;
  description?: string;
  clientName?: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: SaleStatus | InstallmentStatus;
  paymentType: PaymentType;
  tagIds: string[];
  installmentInfo?: {
    number: number;
    total: number;
  };
}

// Filtros de vendas
export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  paymentType?: PaymentType;
  status?: SaleStatus;
  tagIds?: string[];
  searchText?: string;
}

// Dados do relatório
export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
  salesCount: number;
  byPaymentType: Record<PaymentType, number>;
  byMonth: Array<{
    month: string;
    revenue: number;
    received: number;
  }>;
}


// Configurações do app
export interface AppSettings {
  askReturnStockOnDelete: boolean; // Perguntar se quer devolver ao estoque ao excluir venda
}
