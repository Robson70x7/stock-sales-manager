import * as db from '@infra/database/db';
import { Sale, SaleItem } from '@domain/entities/sale';
import { Installment } from '@domain/entities/installment';
import type { ISaleRepository } from '@application/ports/i-sale-repository';

export class SaleRepository implements ISaleRepository {
  async findById(id: string): Promise<Sale | null> {
    const row = await db.getSaleById(id);
    if (!row) return null;
    const items = await db.getSaleItems(id);
    const installments = await db.getInstallments(id);
    return Sale.fromDb(
      row,
      items.map(SaleItem.fromDb),
      installments.map(Installment.fromDb),
    );
  }

  async findAll(): Promise<Sale[]> {
    const rows = await db.getSales();
    const result: Sale[] = [];
    for (const row of rows) {
      const items = await db.getSaleItems(row.id);
      const installments = await db.getInstallments(row.id);
      result.push(
        Sale.fromDb(
          row,
          items.map(SaleItem.fromDb),
          installments.map(Installment.fromDb),
        ),
      );
    }
    return result;
  }

  async findByMonth(year: number, month: number): Promise<Sale[]> {
    const database = await db.getDb();
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const rows = await database.getAllAsync<db.DbSale>(
      `SELECT * FROM sales WHERE isDeleted = 0 AND (
        (DATE(saleDate) >= ? AND DATE(saleDate) <= ?) OR EXISTS (
          SELECT 1 FROM installments WHERE saleId = sales.id AND isDeleted = 0 AND (
            (DATE(dueDate) >= ? AND DATE(dueDate) <= ?) OR (DATE(paidDate) >= ? AND DATE(paidDate) <= ?)
          )
        )
      ) ORDER BY saleDate DESC`,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );

    const result: Sale[] = [];
    for (const row of rows) {
      const items = await db.getSaleItems(row.id);
      const installments = await db.getInstallments(row.id);
      result.push(
        Sale.fromDb(
          row,
          items.map(SaleItem.fromDb),
          installments.map(Installment.fromDb),
        ),
      );
    }
    return result;
  }

  async save(sale: Sale): Promise<void> {
    await db.saveSale(sale.toDbSale());
    await db.deleteSaleItems(sale.id);
    for (const item of sale.toDbItems()) {
      await db.saveSaleItem(item);
    }
    await db.deleteInstallments(sale.id);
    for (const inst of sale.toDbInstallments()) {
      await db.saveInstallment(inst);
    }
  }

  async delete(id: string): Promise<void> {
    await db.deleteSale(id);
  }

  async saveInstallment(installment: {
    id: string; saleId: string; number: number; totalInstallments: number;
    amount: number; dueDate: string; paidDate: string | null;
    status: string; history: string; type: string;
  }): Promise<void> {
    await db.saveInstallment(installment);
  }
}
