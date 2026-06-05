import { describe, it, expect } from 'vitest';
import { Sale } from '../src/domain/entities/sale';
import { Installment } from '../src/domain/entities/installment';
import { SaleService } from '../src/application/services/sale-service';
import { generateInstallments } from '../src/shared/lib/utils';
import type { CreateSaleInput } from '../src/domain/entities/sale';

const mockId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

function makeSaleInput(overrides: Partial<CreateSaleInput> = {}): CreateSaleInput {
  const installments = generateInstallments(300, 3, '2026-04-20');
  return {
    description: 'Venda teste',
    clientId: 'client-1',
    clientName: 'João Silva',
    paymentType: 'credit_card',
    installmentsCount: 3,
    subtotal: 300,
    discountType: null,
    discountValue: 0,
    totalAmount: 300,
    saleDate: '2026-04-20T00:00:00.000Z',
    tagIds: [],
    items: [
      { productId: 'prod-1', productName: 'Produto A', quantity: 2, unitPrice: 150, totalPrice: 300 },
    ],
    installments,
    ...overrides,
  };
}

// ============================================================
// Sale.cancel()
// ============================================================
describe('Sale.cancel()', () => {
  it('altera status para cancelled', () => {
    const sale = Sale.create(makeSaleInput());
    const cancelled = sale.cancel();
    expect(cancelled.status).toBe('cancelled');
  });

  it('original permanece inalterado (imutabilidade)', () => {
    const sale = Sale.create(makeSaleInput());
    sale.cancel();
    expect(sale.status).not.toBe('cancelled');
  });

  it('reseta syncStatus para pending quando estava synced', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      syncStatus: 'synced',
    });
    const cancelled = sale.cancel();
    expect(cancelled.syncStatus).toBe('pending');
  });

  it('mantém syncStatus pending quando já era pending', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      syncStatus: 'pending',
    });
    const cancelled = sale.cancel();
    expect(cancelled.syncStatus).toBe('pending');
  });

  it('mantém syncStatus failed quando era failed', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      syncStatus: 'failed',
    });
    const cancelled = sale.cancel();
    expect(cancelled.syncStatus).toBe('failed');
  });

  it('atualiza updatedAt no cancelamento', () => {
    const sale = Sale.create(makeSaleInput());
    const cancelled = sale.cancel();
    expect(cancelled.updatedAt).toBeDefined();
    expect(cancelled.updatedAt >= sale.createdAt).toBe(true);
  });
});

// ============================================================
// toDbSale()
// ============================================================
describe('Sale.toDbSale()', () => {
  it('entryAmount nunca é null (default 0)', () => {
    const sale = Sale.create(makeSaleInput({ entryAmount: undefined }));
    const db = sale.toDbSale();
    expect(db.entryAmount).toBe(0);
  });

  it('entryAmount preserva valor quando definido', () => {
    const sale = Sale.create(makeSaleInput({ entryAmount: 100 }));
    const db = sale.toDbSale();
    expect(db.entryAmount).toBe(100);
  });
});

// ============================================================
// toDbItems() e toDbInstallments() — sobrescrevem saleId
// ============================================================
describe('Sale.toDbItems() and toDbInstallments()', () => {
  it('toDbItems sobrescreve saleId com o id da venda', () => {
    const sale = Sale.create(makeSaleInput());
    const dbItems = sale.toDbItems();
    dbItems.forEach(item => {
      expect(item.saleId).toBe(sale.id);
    });
  });

  it('toDbInstallments sobrescreve saleId com o id da venda', () => {
    const sale = Sale.create(makeSaleInput());
    const dbInst = sale.toDbInstallments();
    dbInst.forEach(inst => {
      expect(inst.saleId).toBe(sale.id);
    });
  });

  it('toDbInstallments serializa history como string JSON', () => {
    const sale = Sale.create(makeSaleInput());
    const dbInst = sale.toDbInstallments();
    dbInst.forEach(inst => {
      expect(() => JSON.parse(inst.history)).not.toThrow();
    });
  });
});

// ============================================================
// determineSaleStatus()
// ============================================================
describe('SaleService.determineSaleStatus()', () => {
  it('retorna paid quando todas as parcelas estão paid', () => {
    const insts = [
      { status: 'paid' },
      { status: 'paid' },
      { status: 'paid' },
    ];
    expect(SaleService.determineSaleStatus(insts)).toBe('paid');
  });

  it('retorna paid quando todas são paid ou cancelled', () => {
    const insts = [
      { status: 'paid' },
      { status: 'cancelled' },
    ];
    expect(SaleService.determineSaleStatus(insts)).toBe('paid');
  });

  it('retorna partial quando algumas estão paid', () => {
    const insts = [
      { status: 'paid' },
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(SaleService.determineSaleStatus(insts)).toBe('partial');
  });

  it('retorna pending quando nenhuma está paid', () => {
    const insts = [
      { status: 'pending' },
      { status: 'pending' },
    ];
    expect(SaleService.determineSaleStatus(insts)).toBe('pending');
  });

  it('retorna pending quando array vazio', () => {
    expect(SaleService.determineSaleStatus([])).toBe('pending');
  });

  it('retorna paid com parcela única paga', () => {
    const insts = [{ status: 'paid' }];
    expect(SaleService.determineSaleStatus(insts)).toBe('paid');
  });
});

// ============================================================
// Sale.create()
// ============================================================
describe('Sale.create()', () => {
  it('cria venda com status pending por padrão', () => {
    const sale = Sale.create(makeSaleInput());
    expect(sale.status).toBe('pending');
  });

  it('cria venda com syncStatus pending', () => {
    const sale = Sale.create(makeSaleInput());
    expect(sale.syncStatus).toBe('pending');
  });

  it('cria venda com entryAmount 0 quando não informado', () => {
    const sale = Sale.create(makeSaleInput({ entryAmount: undefined }));
    expect(sale.entryAmount).toBe(0);
  });

  it('cria itens com status active', () => {
    const sale = Sale.create(makeSaleInput());
    sale.items.forEach(item => {
      expect(item.status).toBe('active');
    });
  });

  it('instala parcelas com saleId vazio (preenchido por toDbInstallments)', () => {
    const sale = Sale.create(makeSaleInput());
    sale.installments.forEach(inst => {
      expect(inst.saleId).toBe('');
    });
  });

  it('saleDate é preservada como string', () => {
    const sale = Sale.create(makeSaleInput({ saleDate: '2026-04-20T00:00:00.000Z' }));
    expect(sale.saleDate).toBe('2026-04-20T00:00:00.000Z');
  });

  it('gerencia discountType null', () => {
    const sale = Sale.create(makeSaleInput({ discountType: null }));
    expect(sale.discountType).toBeNull();
  });

  it('gerencia discountType percentage', () => {
    const sale = Sale.create(makeSaleInput({ discountType: 'percentage', discountValue: 10, totalAmount: 270 }));
    expect(sale.discountType).toBe('percentage');
    expect(sale.discountValue).toBe(10);
  });
});

// ============================================================
// Instalment.pay()
// ============================================================
describe('Installment.pay()', () => {
  it('altera status para paid', () => {
    const inst = Installment.create({
      saleId: 'sale-1', number: 1, totalInstallments: 3,
      amount: 100, dueDate: '2026-04-20T00:00:00.000Z',
    });
    const paid = inst.pay();
    expect(paid.status).toBe('paid');
  });

  it('define paidDate com a data fornecida', () => {
    const inst = Installment.create({
      saleId: 'sale-1', number: 1, totalInstallments: 3,
      amount: 100, dueDate: '2026-04-20T00:00:00.000Z',
    });
    const paid = inst.pay('2026-04-25T10:00:00.000Z');
    expect(paid.paidDate).toBe('2026-04-25T10:00:00.000Z');
  });

  it('adiciona entrada ao history', () => {
    const inst = Installment.create({
      saleId: 'sale-1', number: 1, totalInstallments: 3,
      amount: 100, dueDate: '2026-04-20T00:00:00.000Z',
    });
    const beforeLen = inst.history.length;
    const paid = inst.pay();
    expect(paid.history.length).toBe(beforeLen + 1);
    expect(paid.history[paid.history.length - 1].status).toBe('paid');
    expect(paid.history[paid.history.length - 1].notes).toBe('Parcela paga');
  });

  it('original permanece inalterado (imutabilidade)', () => {
    const inst = Installment.create({
      saleId: 'sale-1', number: 1, totalInstallments: 3,
      amount: 100, dueDate: '2026-04-20T00:00:00.000Z',
    });
    inst.pay();
    expect(inst.status).not.toBe('paid');
  });
});

// ============================================================
// Sale.isPaid / isCancelled
// ============================================================
describe('Sale.isPaid and isCancelled', () => {
  it('isPaid retorna true quando status é paid', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      status: 'paid',
    });
    expect(sale.isPaid).toBe(true);
  });

  it('isPaid retorna false quando status é pending', () => {
    const sale = Sale.create(makeSaleInput());
    expect(sale.isPaid).toBe(false);
  });

  it('isCancelled retorna true quando status é cancelled', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      status: 'cancelled',
    });
    expect(sale.isCancelled).toBe(true);
  });

  it('isCancelled retorna false quando status é paid', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      status: 'paid',
    });
    expect(sale.isCancelled).toBe(false);
  });
});

// ============================================================
// Fluxo completo: create → pay → cancel
// ============================================================
describe('Fluxo completo de venda', () => {
  it('cria, paga parcelas, e verifica transição de status paid → partial → paid', () => {
    const input = makeSaleInput();
    const sale = Sale.create(input);
    expect(sale.status).toBe('pending');

    const insts = sale.installments;

    // Paga 1a parcela → partial
    const paid1 = insts[0].pay();
    const status1 = SaleService.determineSaleStatus([
      paid1,
      insts[1],
      insts[2],
    ]);
    expect(status1).toBe('partial');

    // Paga 2a parcela → ainda partial
    const paid2 = insts[1].pay();
    const status2 = SaleService.determineSaleStatus([
      paid1,
      paid2,
      insts[2],
    ]);
    expect(status2).toBe('partial');

    // Paga 3a parcela → paid
    const paid3 = insts[2].pay();
    const status3 = SaleService.determineSaleStatus([
      paid1,
      paid2,
      paid3,
    ]);
    expect(status3).toBe('paid');
  });

  it('cria, cancela com syncStatus synced → pending', () => {
    const sale = Sale.restore({
      ...Sale.create(makeSaleInput()),
      syncStatus: 'synced',
    });
    expect(sale.syncStatus).toBe('synced');

    const cancelled = sale.cancel();
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.syncStatus).toBe('pending');
  });

  it('sales itens e parcelas tem UUIDs válidos', () => {
    const sale = Sale.create(makeSaleInput());
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(sale.id).toMatch(uuidRegex);

    sale.items.forEach(item => {
      expect(item.id).toMatch(uuidRegex);
    });

    sale.installments.forEach(inst => {
      expect(inst.id).toMatch(uuidRegex);
    });
  });
});
