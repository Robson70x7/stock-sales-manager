import type { Sale } from '@domain/entities/sale';

export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>;
  findAll(): Promise<Sale[]>;
  findByMonth(year: number, month: number): Promise<Sale[]>;
  save(sale: Sale): Promise<void>;
  delete(id: string): Promise<void>;
  saveInstallment(installment: {
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  }): Promise<void>;
  getInstallments(saleId: string): Promise<{
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  }[]>;
  updateStatus(saleId: string, status: string): Promise<void>;
}
