import type { StockMovement } from '@domain/entities/stock-movement';

export interface IStockMovementRepository {
  findByProduct(productId: string): Promise<StockMovement[]>;
  save(movement: StockMovement): Promise<void>;
  deleteByReference(referenceId: string): Promise<void>;
}
