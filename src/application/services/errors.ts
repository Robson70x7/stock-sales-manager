export class SaleNotFoundError extends Error {
  constructor(id: string) {
    super(`Sale not found: ${id}`);
    this.name = 'SaleNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Product not found: ${id}`);
    this.name = 'ProductNotFoundError';
  }
}

export class ClientNotFoundError extends Error {
  constructor(id: string) {
    super(`Client not found: ${id}`);
    this.name = 'ClientNotFoundError';
  }
}

export class TagNotFoundError extends Error {
  constructor(id: string) {
    super(`Tag not found: ${id}`);
    this.name = 'TagNotFoundError';
  }
}
