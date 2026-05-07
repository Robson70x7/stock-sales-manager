import { describe, it, expect } from 'vitest';
import { generateInstallments, isInMonth } from '../lib/utils';

describe('Installments', () => {
  it('should generate installments with correct due dates', () => {
    const totalAmount = 300;
    const count = 3;
    const startDate = '2026-04-14T00:00:00.000Z'; // April 14, 2026

    const installments = generateInstallments(totalAmount, count, startDate);

    expect(installments).toHaveLength(3);
    expect(installments[0].number).toBe(1);
    expect(installments[1].number).toBe(2);
    expect(installments[2].number).toBe(3);

    // Check amounts
    expect(installments[0].amount).toBe(100);
    expect(installments[1].amount).toBe(100);
    expect(installments[2].amount).toBe(100);

    // Check due dates - each should be one month apart
    const date0 = new Date(installments[0].dueDate);
    const date1 = new Date(installments[1].dueDate);
    const date2 = new Date(installments[2].dueDate);

    expect(date0.getMonth()).toBe(3); // April (0-indexed)
    expect(date1.getMonth()).toBe(4); // May
    expect(date2.getMonth()).toBe(5); // June
  });

  it('should correctly identify if date is in month', () => {
    const april2026 = '2026-04-14T00:00:00.000Z';
    const may2026 = '2026-05-14T00:00:00.000Z';
    const june2026 = '2026-06-14T00:00:00.000Z';

    // April 2026
    expect(isInMonth(april2026, 2026, 3)).toBe(true);
    expect(isInMonth(april2026, 2026, 4)).toBe(false);
    expect(isInMonth(april2026, 2026, 5)).toBe(false);

    // May 2026
    expect(isInMonth(may2026, 2026, 3)).toBe(false);
    expect(isInMonth(may2026, 2026, 4)).toBe(true);
    expect(isInMonth(may2026, 2026, 5)).toBe(false);

    // June 2026
    expect(isInMonth(june2026, 2026, 3)).toBe(false);
    expect(isInMonth(june2026, 2026, 4)).toBe(false);
    expect(isInMonth(june2026, 2026, 5)).toBe(true);
  });

  it('should show installments in their respective months', () => {
    const totalAmount = 300;
    const count = 3;
    const startDate = '2026-04-14T00:00:00.000Z';

    const installments = generateInstallments(totalAmount, count, startDate);

    // Installment 1 should be in April (month 3)
    expect(isInMonth(installments[0].dueDate, 2026, 3)).toBe(true);

    // Installment 2 should be in May (month 4)
    expect(isInMonth(installments[1].dueDate, 2026, 4)).toBe(true);

    // Installment 3 should be in June (month 5)
    expect(isInMonth(installments[2].dueDate, 2026, 5)).toBe(true);
  });
});
