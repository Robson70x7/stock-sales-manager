import type { ISaleRepository } from '@application/ports/i-sale-repository';
import type { IProductRepository } from '@application/ports/i-product-repository';
import type { IStockMovementRepository } from '@application/ports/i-stock-movement-repository';
import { Sale } from '@domain/entities/sale';
import type { Installment } from '@domain/entities/installment';
import { StockMovement } from '@domain/entities/stock-movement';
import { SaleNotFoundError } from './errors';
import type { CreateSaleInput } from '@domain/entities/sale';

export class SaleService {
  constructor(
    private saleRepo: ISaleRepository,
    private productRepo: IProductRepository,
    private stockRepo: IStockMovementRepository,
  ) {}

  async getById(id: string): Promise<Sale | null> {
    return this.saleRepo.findById(id);
  }

  async getByMonth(year: number, month: number): Promise<Sale[]> {
    return this.saleRepo.findByMonth(year, month);
  }

  async create(input: CreateSaleInput): Promise<Sale> {
    const itemsWithCost = await Promise.all(
      input.items.map(async (item) => {
        const { averageCost } = await this.productRepo.getProductStockWithCost(item.productId);
        const costAtSale = item.quantity * averageCost;
        const profitAmount = item.totalPrice - costAtSale;
        return { ...item, costAtSale, profitAmount };
      }),
    );

    const sale = Sale.create({ ...input, items: itemsWithCost });

    await this.saleRepo.save(sale);

    for (const item of sale.items) {
      const movement = StockMovement.createOut(
        item.productId,
        item.quantity,
        sale.id,
        `Venda #${sale.id.slice(0, 8)}`,
        item.costAtSale ?? undefined,
      );
      await this.stockRepo.save(movement);
      await this.productRepo.updateAverageCost(item.productId);
    }

    return sale;
  }

  async cancel(
    id: string,
    returnStock?: boolean,
    refundAmount?: number | null,
    returnProductsWithClient?: boolean | null,
  ): Promise<Sale> {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new SaleNotFoundError(id);

    const updated = sale.cancel(refundAmount, returnProductsWithClient);

    if (returnStock !== false) {
      await this.stockRepo.deleteByReference(id);
    }

    await this.saleRepo.save(updated);
    return updated;
  }

  async update(sale: Sale): Promise<void> {
    const now = new Date().toISOString();
    const updatedSale = Sale.restore({
      ...sale,
      syncStatus: sale.syncStatus === 'synced' ? 'pending' : sale.syncStatus,
      updatedAt: now,
    });
    await this.saleRepo.save(updatedSale);
  }

  async updateInstallment(saleId: string, installment: Installment): Promise<void> {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new SaleNotFoundError(saleId);
    await this.saleRepo.saveInstallment(installment.toDb());

    const allInst = await this.saleRepo.getInstallments(saleId);
    const newStatus = SaleService.determineSaleStatus(allInst);
    await this.saleRepo.updateStatus(saleId, newStatus);

    if (sale.syncStatus === 'synced') {
      await this.saleRepo.updateSyncStatus(saleId, 'pending');
    }
  }

  static determineSaleStatus(installments: { status: string }[]): string {
    if (installments.length === 0) return 'pending';
    const allPaid = installments.every(i => i.status === 'paid' || i.status === 'cancelled');
    const anyPaid = installments.some(i => i.status === 'paid');
    if (allPaid) return 'paid';
    if (anyPaid) return 'partial';
    return 'pending';
  }
}
