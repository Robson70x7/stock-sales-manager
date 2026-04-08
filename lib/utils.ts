import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentType, SaleStatus, InstallmentStatus } from "@/types";

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

// Formata data para exibição
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Formata data curta (dd/mm)
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Nome do mês em português
export function getMonthName(month: number, short = false): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return short ? shortMonths[month] : months[month];
}

// Label do tipo de pagamento
export function getPaymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'Transferência',
    installment: 'Parcelado',
  };
  return labels[type] || type;
}

// Label do status de venda
export function getSaleStatusLabel(status: SaleStatus): string {
  const labels: Record<SaleStatus, string> = {
    pending: 'Pendente',
    partial: 'Parcial',
    paid: 'Pago',
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
  };
  return labels[status] || status;
}

// Cor do status de venda
export function getSaleStatusColor(status: SaleStatus): string {
  const colors: Record<SaleStatus, string> = {
    pending: '#D97706',
    partial: '#2563EB',
    paid: '#16A34A',
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
  };
  return colors[status] || '#64748B';
}

// Gera ID único
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Gera parcelas automaticamente
export function generateInstallments(
  saleId: string,
  totalAmount: number,
  count: number,
  startDate: string
): import('@/types').Installment[] {
  const installmentAmount = totalAmount / count;
  const start = new Date(startDate);
  return Array.from({ length: count }, (_, i) => {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);
    return {
      id: generateId(),
      saleId,
      number: i + 1,
      totalInstallments: count,
      amount: Math.round(installmentAmount * 100) / 100,
      dueDate: dueDate.toISOString(),
      status: 'pending' as const,
    };
  });
}

// Verifica se uma data está no mês/ano especificado
export function isInMonth(dateStr: string, year: number, month: number): boolean {
  const date = new Date(dateStr);
  return date.getFullYear() === year && date.getMonth() === month;
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

// Cores predefinidas para tags
export const TAG_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#EC4899', '#F43F5E', '#64748B',
];
