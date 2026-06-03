import * as db from '@infra/database/db';
import { Product } from '@domain/entities/product';
import type { IProductRepository } from '@application/ports/i-product-repository';

export class ProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const row = await db.getProductById(id);
    if (!row) return null;
    const tagIds = await db.getProductTags(id);
    return Product.fromDb(row, tagIds);
  }

  async findAll(): Promise<Product[]> {
    const rows = await db.getProducts();
    const result: Product[] = [];
    for (const row of rows) {
      const tagIds = await db.getProductTags(row.id);
      result.push(Product.fromDb(row, tagIds));
    }
    return result;
  }

  async save(product: Product): Promise<void> {
    await db.saveProduct(product.toDb());
    await db.setProductTags(product.id, product.tagIds);
  }

  async delete(id: string): Promise<void> {
    await db.deleteProduct(id);
    await db.deleteProductTags(id);
  }

  async getProductStockWithCost(productId: string): Promise<{ stock: number; averageCost: number }> {
    return db.getProductStockWithCost(productId);
  }

  async updateAverageCost(productId: string): Promise<number> {
    return db.updateAverageCost(productId);
  }
}
