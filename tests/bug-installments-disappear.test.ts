import { describe, it, expect } from 'vitest';
import { generateInstallments, isInMonth } from '../src/shared/lib/utils';

describe('Bug: Installments disappear when switching months', () => {
  it('should show installments in all their respective months', () => {
    // Reproducing the exact scenario:
    // - Sale created in April 2026
    // - 3 installments starting from 20/04/2026
    const totalAmount = 300;
    const count = 3;
    const startDate = '2026-04-20T00:00:00.000Z'; // April 20, 2026

    const installments = generateInstallments(totalAmount, count, startDate);

    console.log('Generated installments:');
    installments.forEach((inst, idx) => {
      const date = new Date(inst.dueDate);
      console.log(`  Installment ${idx + 1}: ${date.toISOString()} (Month: ${date.getMonth()}, Year: ${date.getFullYear()})`);
    });

    // Check that we have 3 installments
    expect(installments).toHaveLength(3);

    // Installment 1: April 2026 (month 3)
    expect(isInMonth(installments[0].dueDate, 2026, 3)).toBe(true);
    console.log(`✓ Installment 1 is in April 2026`);

    // Installment 2: May 2026 (month 4)
    expect(isInMonth(installments[1].dueDate, 2026, 4)).toBe(true);
    console.log(`✓ Installment 2 is in May 2026`);

    // Installment 3: June 2026 (month 5)
    expect(isInMonth(installments[2].dueDate, 2026, 5)).toBe(true);
    console.log(`✓ Installment 3 is in June 2026`);

    // Verify they are NOT in other months
    expect(isInMonth(installments[0].dueDate, 2026, 4)).toBe(false);
    expect(isInMonth(installments[1].dueDate, 2026, 3)).toBe(false);
    expect(isInMonth(installments[1].dueDate, 2026, 5)).toBe(false);
    expect(isInMonth(installments[2].dueDate, 2026, 4)).toBe(false);

    console.log(`✓ All installments are in their correct months only`);
  });
});
