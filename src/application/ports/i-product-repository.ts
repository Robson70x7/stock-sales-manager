import type { Product } from '@domain/entities/product';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  getProductStockWithCost(productId: string): Promise<{ stock: number; averageCost: number }>;
  updateAverageCost(productId: string): Promise<number>;
}
