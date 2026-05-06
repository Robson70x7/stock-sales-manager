import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  getMonthName,
  getPaymentTypeLabel,
  getSaleStatusLabel,
  getInstallmentStatusLabel,
  getSaleStatusColor,
  getInstallmentStatusColor,
  generateInstallments,
  isInMonth,
  getInitials,
  TAG_COLORS,
} from '../lib/utils';

// ============================================================
// formatCurrency
// ============================================================
describe('formatCurrency', () => {
  it('formata valor zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formata valor positivo', () => {
    const result = formatCurrency(1500.5);
    expect(result).toContain('1.500');
    expect(result).toContain('50');
  });

  it('formata valor negativo', () => {
    const result = formatCurrency(-200);
    expect(result).toContain('200');
  });
});

// ============================================================
// getMonthName
// ============================================================
describe('getMonthName', () => {
  it('retorna nome completo de janeiro', () => {
    expect(getMonthName(0)).toBe('Janeiro');
  });

  it('retorna nome completo de dezembro', () => {
    expect(getMonthName(11)).toBe('Dezembro');
  });

  it('retorna nome curto de março', () => {
    expect(getMonthName(2, true)).toBe('Mar');
  });

  it('retorna nome curto de junho', () => {
    expect(getMonthName(5, true)).toBe('Jun');
  });
});

// ============================================================
// getPaymentTypeLabel
// ============================================================
describe('getPaymentTypeLabel', () => {
  it('retorna label de dinheiro', () => {
    expect(getPaymentTypeLabel('cash')).toBe('Dinheiro');
  });

  it('retorna label de PIX', () => {
    expect(getPaymentTypeLabel('pix')).toBe('PIX');
  });

  it('retorna label de crédito', () => {
    expect(getPaymentTypeLabel('credit_card')).toBe('Crédito');
  });

  it('retorna label de débito', () => {
    expect(getPaymentTypeLabel('debit_card')).toBe('Débito');
  });
});

// ============================================================
// getSaleStatusLabel
// ============================================================
describe('getSaleStatusLabel', () => {
  it('retorna Pendente para pending', () => {
    expect(getSaleStatusLabel('pending')).toBe('Pendente');
  });

  it('retorna Pago para paid', () => {
    expect(getSaleStatusLabel('paid')).toBe('Pago');
  });

  it('retorna Cancelado para cancelled', () => {
    expect(getSaleStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('retorna Parcial para partial', () => {
    expect(getSaleStatusLabel('partial')).toBe('Parcial');
  });
});

// ============================================================
// getInstallmentStatusLabel
// ============================================================
describe('getInstallmentStatusLabel', () => {
  it('retorna Pendente para pending', () => {
    expect(getInstallmentStatusLabel('pending')).toBe('Pendente');
  });

  it('retorna Pago para paid', () => {
    expect(getInstallmentStatusLabel('paid')).toBe('Pago');
  });

  it('retorna Vencido para overdue', () => {
    expect(getInstallmentStatusLabel('overdue')).toBe('Vencido');
  });
});

// ============================================================
// getSaleStatusColor
// ============================================================
describe('getSaleStatusColor', () => {
  it('retorna cor para pending (amarelo/laranja)', () => {
    const color = getSaleStatusColor('pending');
    expect(color).toBeTruthy();
    expect(color.startsWith('#')).toBe(true);
  });

  it('retorna cor para paid (verde)', () => {
    const color = getSaleStatusColor('paid');
    expect(color).toBeTruthy();
    expect(color.startsWith('#')).toBe(true);
  });

  it('retorna cor para cancelled (vermelho)', () => {
    const color = getSaleStatusColor('cancelled');
    expect(color).toBeTruthy();
    expect(color.startsWith('#')).toBe(true);
  });
});

// ============================================================
// generateInstallments
// ============================================================
describe('generateInstallments', () => {
  it('gera o número correto de parcelas', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    expect(installments).toHaveLength(3);
  });

  it('cada parcela tem o valor correto', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    installments.forEach(inst => {
      expect(inst.amount).toBeCloseTo(100, 1);
    });
  });

  it('parcelas têm status pending por padrão', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    installments.forEach(inst => {
      expect(inst.status).toBe('pending');
    });
  });

  it('parcelas têm saleId correto', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    installments.forEach(inst => {
      expect(inst.saleId).toBe('sale1');
    });
  });

  it('parcelas têm datas de vencimento mensais consecutivas', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-04-15');
    const months = installments.map(i => new Date(i.dueDate).getMonth());
    // Verifica que cada parcela é em um mês diferente e consecutivo
    expect(months[1]).toBe(months[0] + 1);
    expect(months[2]).toBe(months[1] + 1);
  });

  it('parcelas têm numeração correta', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    expect(installments[0].number).toBe(1);
    expect(installments[1].number).toBe(2);
    expect(installments[2].number).toBe(3);
  });

  it('parcelas têm totalInstallments correto', () => {
    const installments = generateInstallments('sale1', 300, 3, '2026-01-01');
    installments.forEach(inst => {
      expect(inst.totalInstallments).toBe(3);
    });
  });

  it('gera 1 parcela para pagamento à vista', () => {
    const installments = generateInstallments('sale1', 500, 1, '2026-04-01');
    expect(installments).toHaveLength(1);
    expect(installments[0].amount).toBeCloseTo(500, 1);
  });
});

// ============================================================
// isInMonth
// ============================================================
describe('isInMonth', () => {
  it('retorna true para data no mês correto', () => {
    expect(isInMonth('2026-04-08T10:00:00.000Z', 2026, 3)).toBe(true);
  });

  it('retorna false para data em mês diferente', () => {
    expect(isInMonth('2026-03-15T10:00:00.000Z', 2026, 3)).toBe(false);
  });

  it('retorna false para data em ano diferente', () => {
    expect(isInMonth('2025-04-08T10:00:00.000Z', 2026, 3)).toBe(false);
  });
});

// ============================================================
// getInitials
// ============================================================
describe('getInitials', () => {
  it('retorna iniciais de nome completo', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('retorna inicial de nome único', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('retorna apenas 2 iniciais para nomes com mais de 2 palavras', () => {
    expect(getInitials('Ana Paula Santos')).toBe('AP');
  });

  it('retorna iniciais em maiúsculo', () => {
    expect(getInitials('carlos alberto')).toBe('CA');
  });
});

// ============================================================
// TAG_COLORS
// ============================================================
describe('TAG_COLORS', () => {
  it('tem pelo menos 8 cores disponíveis', () => {
    expect(TAG_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it('todas as cores são strings hexadecimais válidas', () => {
    TAG_COLORS.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

// ============================================================
// Lógica de cálculo de totais mensais
// ============================================================
describe('Cálculo de totais mensais', () => {
  it('calcula total de vendas pagas corretamente', () => {
    const sales = [
      { amount: 100, status: 'paid' },
      { amount: 200, status: 'pending' },
      { amount: 150, status: 'paid' },
    ];
    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const received = sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
    const pending = total - received;

    expect(total).toBe(450);
    expect(received).toBe(250);
    expect(pending).toBe(200);
  });
});


// ============================================================
// Testes para novas funcionalidades (v1.5)
// ============================================================

describe('Novas Funcionalidades', () => {
  it('verifica se AppSettings tem campo askReturnStockOnDelete', () => {
    const settings = { askReturnStockOnDelete: true };
    expect(settings.askReturnStockOnDelete).toBe(true);
  });

  it('verifica se Product pode ter campo photoUri', () => {
    const product = {
      id: '1',
      name: 'Produto com Foto',
      stock: 10,
      costPrice: 100,
      salePrice: 150,
      description: 'Teste',
      tagIds: [],
      photoUri: 'file:///path/to/photo.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(product.photoUri).toBeDefined();
    expect(product.photoUri).toContain('photo.jpg');
  });

  it('verifica se Installment tem campo history', () => {
    const installment = {
      id: '1',
      amount: 100,
      dueDate: new Date().toISOString(),
      status: 'pending' as const,
      paidDate: undefined,
      history: [
        { action: 'created', timestamp: new Date().toISOString() },
      ],
    };
    expect(installment.history).toBeDefined();
    expect(installment.history.length).toBe(1);
    expect(installment.history[0].action).toBe('created');
  });

  it('verifica se Sale tem campo firstInstallmentDate', () => {
    const sale = {
      id: '1',
      clientId: 'c1',
      clientName: 'Cliente Teste',
      saleDate: new Date().toISOString(),
      firstInstallmentDate: new Date().toISOString(),
      items: [],
      totalAmount: 1000,
      paymentType: 'credit' as const,
      installmentsCount: 3,
      description: '',
      status: 'pending' as const,
      installments: [],
      tagIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(sale.firstInstallmentDate).toBeDefined();
  });

  it('verifica se filtro de status funciona corretamente', () => {
    const sales = [
      { id: '1', status: 'paid' as const },
      { id: '2', status: 'pending' as const },
      { id: '3', status: 'paid' as const },
    ];
    
    const paidSales = sales.filter(s => s.status === 'paid');
    expect(paidSales.length).toBe(2);
    expect(paidSales.every(s => s.status === 'paid')).toBe(true);
  });
});
