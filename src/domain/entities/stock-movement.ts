export type StockMovementType = 'in' | 'out' | 'initial' | 'adjustment';

export interface StockMovementProps {
  id: string;
  productId: string;
  quantity: number;
  type: StockMovementType;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  unitCost: number | null;
  totalCost: number | null;
}

export class StockMovement {
  readonly id: string;
  readonly productId: string;
  readonly quantity: number;
  readonly type: StockMovementType;
  readonly referenceId: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly unitCost: number | null;
  readonly totalCost: number | null;

  private constructor(props: StockMovementProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.type = props.type;
    this.referenceId = props.referenceId;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.unitCost = props.unitCost;
    this.totalCost = props.totalCost;
  }

  static fromDb(row: {
    id: string; productId: string; quantity: number; type: string;
    referenceId: string | null; notes: string | null; createdAt: string;
    unitCost: number | null; totalCost: number | null;
  }): StockMovement {
    return new StockMovement({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      type: row.type as StockMovementType,
      referenceId: row.referenceId,
      notes: row.notes,
      createdAt: row.createdAt,
      unitCost: row.unitCost,
      totalCost: row.totalCost,
    });
  }

  static createOut(
    productId: string,
    quantity: number,
    referenceId: string,
    notes?: string,
    unitCost?: number,
  ): StockMovement {
    const now = new Date().toISOString();
    const totalCost = unitCost != null ? unitCost * quantity : null;
    return new StockMovement({
      id: generateFallbackId(),
      productId,
      quantity,
      type: 'out',
      referenceId,
      notes: notes || null,
      createdAt: now,
      unitCost: unitCost ?? null,
      totalCost,
    });
  }

  toDb(): {
    id: string; productId: string; quantity: number; type: string;
    referenceId: string | null; notes: string | null; createdAt: string;
    isDeleted: number; unitCost: number | null; totalCost: number | null;
  } {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      type: this.type,
      referenceId: this.referenceId,
      notes: this.notes,
      createdAt: this.createdAt,
      unitCost: this.unitCost,
      totalCost: this.totalCost,
      isDeleted: 0,
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
