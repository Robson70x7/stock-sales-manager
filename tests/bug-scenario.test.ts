import { describe, it, expect } from 'vitest';
import { generateInstallments, isInMonth } from '../lib/utils';

describe('Bug Scenario: Sale disappears when switching months', () => {
  it('should show sale with 3 installments in all 3 months', () => {
    // User scenario:
    // - Created sale in April 2026
    // - 3 installments starting from 20/04/2026
    // - Expected: Sale appears in April, May, and June

    const saleId = 'sale-123';
    const totalAmount = 300;
    const count = 3;
    const startDate = '2026-04-20'; // User selected date from picker

    // Simulate what happens in handleSave
    const firstInstallmentDateISO = new Date(startDate).toISOString();
    console.log('firstInstallmentDate (ISO):', firstInstallmentDateISO);

    const installments = generateInstallments(saleId, totalAmount, count, firstInstallmentDateISO);

    console.log('\nGenerated installments:');
    installments.forEach((inst, idx) => {
      const date = new Date(inst.dueDate);
      console.log(`  Inst ${idx + 1}: ${inst.dueDate}`);
      console.log(`    - Parsed: ${date.toISOString()}`);
      console.log(`    - Month: ${date.getMonth()}, Year: ${date.getFullYear()}`);
    });

    // Now simulate the summary items logic
    console.log('\nChecking visibility in each month:');

    // April 2026 (month 3)
    const aprilItems = installments.filter(inst => isInMonth(inst.dueDate, 2026, 3));
    console.log(`  April 2026: ${aprilItems.length} installment(s)`);
    expect(aprilItems.length).toBe(1);

    // May 2026 (month 4)
    const mayItems = installments.filter(inst => isInMonth(inst.dueDate, 2026, 4));
    console.log(`  May 2026: ${mayItems.length} installment(s)`);
    expect(mayItems.length).toBe(1);

    // June 2026 (month 5)
    const juneItems = installments.filter(inst => isInMonth(inst.dueDate, 2026, 5));
    console.log(`  June 2026: ${juneItems.length} installment(s)`);
    expect(juneItems.length).toBe(1);

    // Verify no installments in other months
    const marchItems = installments.filter(inst => isInMonth(inst.dueDate, 2026, 2));
    console.log(`  March 2026: ${marchItems.length} installment(s)`);
    expect(marchItems.length).toBe(0);

    const julyItems = installments.filter(inst => isInMonth(inst.dueDate, 2026, 6));
    console.log(`  July 2026: ${julyItems.length} installment(s)`);
    expect(julyItems.length).toBe(0);
  });

  it('should verify installments array is not empty', () => {
    const startDate = '2026-04-20';
    const firstInstallmentDateISO = new Date(startDate).toISOString();
    const installments = generateInstallments('sale-123', 300, 3, firstInstallmentDateISO);

    expect(installments).toHaveLength(3);
    expect(installments[0]).toBeDefined();
    expect(installments[0].dueDate).toBeDefined();
    expect(installments[0].dueDate).not.toBe('');
  });
});
