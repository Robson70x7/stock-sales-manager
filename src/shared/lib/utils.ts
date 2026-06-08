import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentType, SaleStatus, InstallmentStatus, StockMovementType } from "@shared/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata valor monetário em BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Aplica máscara de moeda BRL em string
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  // Converte para número (últimos 2 dígitos são centavos)
  const number = parseInt(digits, 10) / 100;
  
  // Formata com separadores brasileiros
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Remove máscara e retorna valor numérico
export function unmaskCurrency(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Constrói string YYYY-MM-DD a partir de componentes numéricos (sem timezone)
export function formatDateISO(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Formata data para exibição
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

// Formata data curta (dd/mm)
export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}`;
}

// Nome do mês em português
export function getMonthName(month: number, short = false, year?: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthName = short ? shortMonths[month] : months[month];
  return year ? `${monthName} ${year}` : monthName;
}

// Label do tipo de pagamento
export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    credit_card: 'Crédito',
    debit_card: 'Débito',
  };
  return labels[type] || type;
}

// Label do status de venda
export function getSaleStatusLabel(status: SaleStatus): string {
  const labels: Record<SaleStatus, string> = {
    pending: 'Pendente',
    partial: 'Parcial',
    paid: 'Pago',
    refunded: 'Reembolsado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

// Label do status de parcela
export function getInstallmentStatusLabel(status: InstallmentStatus): string {
  const labels: Record<InstallmentStatus, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

// Cor do status de venda
export function getSaleStatusColor(status: SaleStatus): string {
  const colors: Record<SaleStatus, string> = {
    pending: '#D97706',
    partial: '#2563EB',
    paid: '#16A34A',
    refunded: '#06B6D4',
    cancelled: '#DC2626',
  };
  return colors[status] || '#64748B';
}

// Cor do status de parcela
export function getInstallmentStatusColor(status: InstallmentStatus): string {
  const colors: Record<InstallmentStatus, string> = {
    pending: '#D97706',
    paid: '#16A34A',
    overdue: '#DC2626',
    cancelled: '#6B7280',
  };
  return colors[status] || '#64748B';
}

// Gera UUID v4
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Gera parcelas com entrada
export function generateInstallmentsWithEntry(
  totalAmount: number,
  entryAmount: number,
  count: number,
  startDate: string
): import('@shared/types').Installment[] {
  const remaining = totalAmount - entryAmount;
  const remainingCount = count;
  const installmentAmount = remainingCount > 0 ? Math.round((remaining / remainingCount) * 100) / 100 : 0;
  const [yearStr, monthStr, dayStr] = startDate.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonth = parseInt(monthStr, 10) - 1; // 0-indexed
  const baseDay = parseInt(dayStr, 10);

  const installments: import('@shared/types').Installment[] = [];

  // Parcela de entrada (número 0, vence na data inicial)
  const nowISO = new Date().toISOString();
  installments.push({
    id: generateId(),
    saleId: '',
    number: 0,
    totalInstallments: count,
    amount: entryAmount,
    dueDate: `${formatDateISO(baseYear, baseMonth, baseDay)}T00:00:00.000Z`,
    status: 'paid' as const,
    paidDate: nowISO,
    history: [{
      date: nowISO,
      status: 'paid' as const,
      notes: 'Entrada',
    }],
    type: 'entry',
  });

  // Demais parcelas
  for (let i = 1; i <= count; i++) {
    const dueDate = new Date(baseYear, baseMonth, baseDay);
    dueDate.setMonth(dueDate.getMonth() + i);
    installments.push({
      id: generateId(),
      saleId: '',
      number: i,
      totalInstallments: count,
      amount: installmentAmount,
      dueDate: `${formatDateISO(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())}T00:00:00.000Z`,
      status: 'pending' as const,
      history: [{
        date: nowISO,
        status: 'pending' as const,
        notes: 'Parcela criada',
      }],
      type: 'normal',
    });
  }

  return installments;
}

// Label do tipo de movimentação de estoque
export function getMovementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    in: 'Entrada',
    out: 'Saída',
    initial: 'Estoque Inicial',
    adjustment: 'Ajuste',
  };
  return labels[type] || type;
}

// Gera parcelas automaticamente
export function generateInstallments(
  totalAmount: number,
  count: number,
  startDate: string
): import('@shared/types').Installment[] {
  const installmentAmount = totalAmount / count;
  const [yearStr, monthStr, dayStr] = startDate.split('-');
  const baseYear = parseInt(yearStr, 10);
  const baseMonth = parseInt(monthStr, 10) - 1;
  const baseDay = parseInt(dayStr, 10);
  const nowISO = new Date().toISOString();

  return Array.from({ length: count }, (_, i) => {
    const dueDate = new Date(baseYear, baseMonth, baseDay);
    dueDate.setMonth(dueDate.getMonth() + i);
    return {
      id: generateId(),
      saleId: '',
      number: i + 1,
      totalInstallments: count,
      amount: Math.round(installmentAmount * 100) / 100,
      dueDate: `${formatDateISO(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())}T00:00:00.000Z`,
      status: 'pending' as const,
      history: [{
        date: nowISO,
        status: 'pending' as const,
        notes: 'Parcela criada',
      }],
      type: 'normal' as const,
    };
  });
}

// Verifica se uma data está no mês/ano especificado
export function isInMonth(dateStr: string, year: number, month: number): boolean {
  const d = dateStr.split('T')[0].split('-');
  return parseInt(d[0], 10) === year && parseInt(d[1], 10) - 1 === month;
}

// Obtém iniciais do nome
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

// Cores predefinidas para tags (8 cores distintas do desktop)
export const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
];
