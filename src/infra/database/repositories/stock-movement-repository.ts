import * as db from '@infra/database/db';
import { StockMovement } from '@domain/entities/stock-movement';
import type { IStockMovementRepository } from '@application/ports/i-stock-movement-repository';

export class StockMovementRepository implements IStockMovementRepository {
  async findByProduct(productId: string): Promise<StockMovement[]> {
    const rows = await db.getStockMovementsByProduct(productId);
    return rows.map(StockMovement.fromDb);
  }

  async save(movement: StockMovement): Promise<void> {
    await db.saveStockMovement(movement.toDb());
  }

  async deleteByReference(referenceId: string): Promise<void> {
    await db.deleteStockMovementsByReference(referenceId);
  }
}
