import type { IProductRepository } from '@application/ports/i-product-repository';
import { Product } from '@domain/entities/product';
import type { CreateProductInput } from '@domain/entities/product';
import { ProductNotFoundError } from './errors';

export class ProductService {
  constructor(private productRepo: IProductRepository) {}

  async list(): Promise<Product[]> {
    return this.productRepo.findAll();
  }

  async get(id: string): Promise<Product | null> {
    return this.productRepo.findById(id);
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product = Product.create(input);
    await this.productRepo.save(product);
    return product;
  }

  async update(product: Product): Promise<void> {
    const existing = await this.productRepo.findById(product.id);
    if (!existing) throw new ProductNotFoundError(product.id);
    await this.productRepo.save(product);
  }

  async delete(id: string): Promise<void> {
    await this.productRepo.delete(id);
  }
}
