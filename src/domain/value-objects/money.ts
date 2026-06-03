export class Money {
  private constructor(public readonly amount: number) {}

  static fromNumber(amount: number): Money {
    if (!Number.isFinite(amount)) throw new Error('Invalid money amount');
    return new Money(Math.round(amount * 100) / 100);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return Money.fromNumber(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.fromNumber(this.amount - other.amount);
  }

  multiply(factor: number): Money {
    return Money.fromNumber(this.amount * factor);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  get isZero(): boolean {
    return this.amount === 0;
  }

  toBRL(): string {
    return this.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  toJSON(): number {
    return this.amount;
  }
}
