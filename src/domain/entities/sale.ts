import { Installment } from './installment';

export type SaleItemStatus = 'active' | 'cancelled';
export type PaymentType = 'cash' | 'pix' | 'credit_card' | 'debit_card';
export type SaleStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type SaleSyncStatus = 'pending' | 'synced' | 'failed';

export interface SaleItemProps {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costAtSale: number | null;
  profitAmount: number | null;
  status: SaleItemStatus;
}

export class SaleItem {
  readonly id: string;
  readonly saleId: string;
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly costAtSale: number | null;
  readonly profitAmount: number | null;
  readonly status: SaleItemStatus;

  private constructor(props: SaleItemProps) {
    this.id = props.id;
    this.saleId = props.saleId;
    this.productId = props.productId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.totalPrice = props.totalPrice;
    this.costAtSale = props.costAtSale;
    this.profitAmount = props.profitAmount;
    this.status = props.status;
  }

  static fromDb(row: {
    id: string; saleId: string; productId: string; productName: string;
    quantity: number; unitPrice: number; totalPrice: number;
    costAtSale: number | null; profitAmount: number | null; status: string | null;
  }): SaleItem {
    return new SaleItem({
      id: row.id,
      saleId: row.saleId,
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.totalPrice,
      costAtSale: row.costAtSale,
      profitAmount: row.profitAmount,
      status: (row.status as SaleItemStatus) || 'active',
    });
  }

  static create(input: {
    id: string; saleId: string; productId: string; productName: string;
    quantity: number; unitPrice: number; totalPrice: number;
    costAtSale?: number; profitAmount?: number;
  }): SaleItem {
    return new SaleItem({
      id: input.id,
      saleId: input.saleId,
      productId: input.productId,
      productName: input.productName,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      totalPrice: input.totalPrice,
      costAtSale: input.costAtSale ?? null,
      profitAmount: input.profitAmount ?? null,
      status: 'active',
    });
  }

  toDb(): {
    id: string; saleId: string; productId: string; productName: string;
    quantity: number; unitPrice: number; totalPrice: number;
    costAtSale: number | null; profitAmount: number | null; status: string;
  } {
    return {
      id: this.id,
      saleId: this.saleId,
      productId: this.productId,
      productName: this.productName,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      totalPrice: this.totalPrice,
      costAtSale: this.costAtSale,
      profitAmount: this.profitAmount,
      status: this.status,
    };
  }
}

export interface SaleProps {
  id: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  paymentType: PaymentType;
  installmentsCount: number;
  subtotal: number;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  totalAmount: number;
  entryAmount: number | null;
  entryPaymentType: PaymentType | null;
  status: SaleStatus;
  saleDate: string;
  firstInstallmentDate: string | null;
  tagIds: string[];
  items: SaleItem[];
  installments: Installment[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SaleSyncStatus | null;
  syncError: string | null;
  syncWarnings: Array<{ productId: string; productName: string; available: number; quantity: number }> | null;
}

export interface CreateSaleInput {
  description?: string;
  clientId?: string;
  clientName?: string;
  paymentType: PaymentType;
  installmentsCount: number;
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue: number;
  totalAmount: number;
  entryAmount?: number;
  entryPaymentType?: PaymentType;
  status?: SaleStatus;
  saleDate: string;
  firstInstallmentDate?: string;
  tagIds: string[];
  items: Array<{
    id?: string; saleId?: string; productId: string; productName: string;
    quantity: number; unitPrice: number; totalPrice: number;
    costAtSale?: number; profitAmount?: number;
  }>;
  installments: Array<{
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate?: string | null;
    status: string; history: Array<{ date: string; status: string; notes?: string }>;
    type?: string;
  }>;
}

export class Sale {
  readonly id: string;
  readonly description: string | null;
  readonly clientId: string | null;
  readonly clientName: string | null;
  readonly paymentType: PaymentType;
  readonly installmentsCount: number;
  readonly subtotal: number;
  readonly discountType: 'percentage' | 'fixed' | null;
  readonly discountValue: number;
  readonly totalAmount: number;
  readonly entryAmount: number | null;
  readonly entryPaymentType: PaymentType | null;
  readonly status: SaleStatus;
  readonly saleDate: string;
  readonly firstInstallmentDate: string | null;
  readonly tagIds: string[];
  readonly items: SaleItem[];
  readonly installments: Installment[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly syncStatus: SaleSyncStatus | null;
  readonly syncError: string | null;
  readonly syncWarnings: Array<{ productId: string; productName: string; available: number; quantity: number }> | null;

  private constructor(props: SaleProps) {
    this.id = props.id;
    this.description = props.description;
    this.clientId = props.clientId;
    this.clientName = props.clientName;
    this.paymentType = props.paymentType;
    this.installmentsCount = props.installmentsCount;
    this.subtotal = props.subtotal;
    this.discountType = props.discountType;
    this.discountValue = props.discountValue;
    this.totalAmount = props.totalAmount;
    this.entryAmount = props.entryAmount;
    this.entryPaymentType = props.entryPaymentType;
    this.status = props.status;
    this.saleDate = props.saleDate;
    this.firstInstallmentDate = props.firstInstallmentDate;
    this.tagIds = props.tagIds;
    this.items = props.items;
    this.installments = props.installments;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.syncStatus = props.syncStatus;
    this.syncError = props.syncError;
    this.syncWarnings = props.syncWarnings;
  }

  static fromDb(
    row: {
      id: string; description: string | null; clientId: string | null;
      clientName: string | null; paymentType: string; installmentsCount: number;
      subtotal: number; discountType: string | null; discountValue: number;
      totalAmount: number; entryAmount: number | null;
      entryPaymentType: string | null; status: string; saleDate: string;
      firstInstallmentDate: string | null; tagIds: string;
      createdAt: string; updatedAt: string;
      syncStatus: string | null; syncError: string | null; syncWarnings: string | null;
    },
    items: SaleItem[],
    installments: Installment[],
  ): Sale {
    return new Sale({
      id: row.id,
      description: row.description || null,
      clientId: row.clientId || null,
      clientName: row.clientName || null,
      paymentType: row.paymentType as PaymentType,
      installmentsCount: row.installmentsCount,
      subtotal: row.subtotal,
      discountType: (row.discountType as 'percentage' | 'fixed') || null,
      discountValue: row.discountValue,
      totalAmount: row.totalAmount,
      entryAmount: row.entryAmount ?? null,
      entryPaymentType: row.entryPaymentType as PaymentType || null,
      status: row.status as SaleStatus,
      saleDate: row.saleDate,
      firstInstallmentDate: row.firstInstallmentDate || null,
      tagIds: JSON.parse(row.tagIds || '[]'),
      items,
      installments,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncStatus: (row.syncStatus as SaleSyncStatus) || null,
      syncError: row.syncError || null,
      syncWarnings: row.syncWarnings ? JSON.parse(row.syncWarnings) : null,
    });
  }

  static restore(props: SaleProps): Sale {
    return new Sale(props);
  }

  static create(input: CreateSaleInput): Sale {
    const now = new Date().toISOString();
    return new Sale({
      id: crypto.randomUUID?.() ?? generateFallbackId(),
      description: input.description ?? null,
      clientId: input.clientId ?? null,
      clientName: input.clientName ?? null,
      paymentType: input.paymentType,
      installmentsCount: input.installmentsCount,
      subtotal: input.subtotal,
      discountType: input.discountType ?? null,
      discountValue: input.discountValue,
      totalAmount: input.totalAmount,
      entryAmount: input.entryAmount ?? null,
      entryPaymentType: input.entryPaymentType ?? null,
      status: input.status ?? 'pending',
      saleDate: input.saleDate,
      firstInstallmentDate: input.firstInstallmentDate ?? null,
      tagIds: input.tagIds,
      items: input.items.map(i => SaleItem.create({
        ...i,
        id: i.id || (crypto.randomUUID?.() ?? generateFallbackId()),
        saleId: i.saleId || '',
      })),
      installments: input.installments.map(inst =>
        Installment.fromDb({
          id: inst.id,
          saleId: inst.saleId,
          number: inst.number,
          totalInstallments: inst.totalInstallments,
          amount: inst.amount,
          dueDate: inst.dueDate,
          paidDate: inst.paidDate ?? null,
          status: inst.status,
          history: JSON.stringify(inst.history || []),
          type: inst.type || 'normal',
        }),
      ),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      syncError: null,
      syncWarnings: null,
    });
  }

  get totalProfit(): number {
    return this.items.reduce((sum, i) => sum + (i.profitAmount ?? 0), 0);
  }

  get isPaid(): boolean {
    return this.status === 'paid';
  }

  get isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  cancel(): Sale {
    return new Sale({
      ...this,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  }

  toDbSale(): {
    id: string; description: string | null; clientId: string | null;
    clientName: string | null; paymentType: string; installmentsCount: number;
    subtotal: number; discountType: string | null; discountValue: number;
    totalAmount: number; entryAmount: number | null;
    entryPaymentType: string | null; status: string; saleDate: string;
    firstInstallmentDate: string | null; tagIds: string;
    createdAt: string; updatedAt: string;
    syncStatus: string | null; syncError: string | null; syncWarnings: string | null;
  } {
    return {
      id: this.id,
      description: this.description,
      clientId: this.clientId,
      clientName: this.clientName,
      paymentType: this.paymentType,
      installmentsCount: this.installmentsCount,
      subtotal: this.subtotal,
      discountType: this.discountType,
      discountValue: this.discountValue,
      totalAmount: this.totalAmount,
      entryAmount: this.entryAmount ?? null,
      entryPaymentType: this.entryPaymentType,
      status: this.status,
      saleDate: this.saleDate,
      firstInstallmentDate: this.firstInstallmentDate,
      tagIds: JSON.stringify(this.tagIds),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      syncStatus: this.syncStatus,
      syncError: this.syncError,
      syncWarnings: this.syncWarnings ? JSON.stringify(this.syncWarnings) : null,
    };
  }

  toDbItems(): Array<{
    id: string; saleId: string; productId: string; productName: string;
    quantity: number; unitPrice: number; totalPrice: number;
    costAtSale: number | null; profitAmount: number | null; status: string;
  }> {
    return this.items.map(item => item.toDb());
  }

  toDbInstallments(): Array<{
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  }> {
    return this.installments.map(inst => ({
      id: inst.id,
      saleId: inst.saleId,
      number: inst.number,
      totalInstallments: inst.totalInstallments,
      amount: inst.amount,
      dueDate: inst.dueDate,
      paidDate: inst.paidDate ?? null,
      status: inst.status,
      history: JSON.stringify(inst.history),
      type: inst.type || 'normal',
    }));
  }
}

function generateFallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
