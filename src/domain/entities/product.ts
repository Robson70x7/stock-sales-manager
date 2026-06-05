export interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  averageCost: number;
  unit: string | null;
  photoUri: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  category?: string;
  costPrice: number;
  salePrice: number;
  stock?: number;
  averageCost?: number;
  unit?: string;
  photoUri?: string;
  tagIds?: string[];
}

export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly costPrice: number;
  readonly salePrice: number;
  readonly stock: number;
  readonly averageCost: number;
  readonly unit: string | null;
  readonly photoUri: string | null;
  readonly tagIds: string[];
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.category = props.category;
    this.costPrice = props.costPrice;
    this.salePrice = props.salePrice;
    this.stock = props.stock;
    this.averageCost = props.averageCost;
    this.unit = props.unit;
    this.photoUri = props.photoUri;
    this.tagIds = props.tagIds;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromDb(
    row: {
      id: string; name: string; description: string | null; category: string | null;
      costPrice: number; salePrice: number; stock: number; averageCost: number;
      unit: string | null; photoUri: string | null;
      createdAt: string; updatedAt: string;
    },
    tagIds: string[],
  ): Product {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      costPrice: row.costPrice,
      salePrice: row.salePrice,
      stock: row.stock,
      averageCost: row.averageCost,
      unit: row.unit,
      photoUri: row.photoUri,
      tagIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static create(input: CreateProductInput): Product {
    const now = new Date().toISOString();
    return new Product({
      id: generateFallbackId(),
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      stock: input.stock ?? 0,
      averageCost: input.averageCost ?? 0,
      unit: input.unit ?? null,
      photoUri: input.photoUri ?? null,
      tagIds: input.tagIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  get margin(): number {
    if (this.salePrice === 0) return 0;
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100;
  }

  get profit(): number {
    return this.salePrice - this.costPrice;
  }

  toDb(): {
    id: string; name: string; description: string | null; category: string | null;
    costPrice: number; salePrice: number; stock: number; averageCost: number;
    unit: string | null; photoUri: string | null;
    createdAt: string; updatedAt: string;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      costPrice: this.costPrice,
      salePrice: this.salePrice,
      stock: this.stock,
      averageCost: this.averageCost,
      unit: this.unit,
      photoUri: this.photoUri,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
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
