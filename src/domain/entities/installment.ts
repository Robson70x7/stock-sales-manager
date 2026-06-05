export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type InstallmentType = 'normal' | 'entry';

export interface InstallmentHistory {
  date: string;
  status: InstallmentStatus;
  notes?: string;
}

export interface InstallmentProps {
  id: string;
  saleId: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: InstallmentStatus;
  history: InstallmentHistory[];
  type: InstallmentType;
}

export class Installment {
  readonly id: string;
  readonly saleId: string;
  readonly number: number;
  readonly totalInstallments: number;
  readonly amount: number;
  readonly dueDate: string;
  readonly paidDate: string | null;
  readonly status: InstallmentStatus;
  readonly history: InstallmentHistory[];
  readonly type: InstallmentType;

  private constructor(props: InstallmentProps) {
    this.id = props.id;
    this.saleId = props.saleId;
    this.number = props.number;
    this.totalInstallments = props.totalInstallments;
    this.amount = props.amount;
    this.dueDate = props.dueDate;
    this.paidDate = props.paidDate;
    this.status = props.status;
    this.history = props.history;
    this.type = props.type;
  }

  static fromDb(row: {
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  }): Installment {
    return new Installment({
      id: row.id,
      saleId: row.saleId,
      number: row.number,
      totalInstallments: row.totalInstallments,
      amount: row.amount,
      dueDate: row.dueDate,
      paidDate: row.paidDate,
      status: row.status as InstallmentStatus,
      history: JSON.parse(row.history || '[]'),
      type: (row.type as InstallmentType) || 'normal',
    });
  }

  static create(input: {
    saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; type?: InstallmentType;
  }): Installment {
    return new Installment({
      id: generateFallbackId(),
      saleId: input.saleId,
      number: input.number,
      totalInstallments: input.totalInstallments,
      amount: input.amount,
      dueDate: input.dueDate,
      paidDate: null,
      status: 'pending',
      history: [{
        date: new Date().toISOString(),
        status: 'pending' as const,
        notes: 'Parcela criada',
      }],
      type: input.type || 'normal',
    });
  }

  get isOverdue(): boolean {
    if (this.status === 'paid') return false;
    return new Date(this.dueDate) < new Date();
  }

  pay(paidDate?: string): Installment {
    const now = paidDate || new Date().toISOString();
    return new Installment({
      ...this,
      paidDate: now,
      status: 'paid',
      history: [
        ...this.history,
        { date: now, status: 'paid' as const, notes: 'Parcela paga' },
      ],
    });
  }

  toDb(): {
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  } {
    return {
      id: this.id,
      saleId: this.saleId,
      number: this.number,
      totalInstallments: this.totalInstallments,
      amount: this.amount,
      dueDate: this.dueDate,
      paidDate: this.paidDate,
      status: this.status,
      history: JSON.stringify(this.history),
      type: this.type,
    };
  }
}

function generateFallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
