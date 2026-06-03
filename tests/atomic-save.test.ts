import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateId, generateInstallments } from '../src/shared/lib/utils';

describe('Atomic Sale Save', () => {
  it('should generate valid UUIDs', () => {
    const id = generateId();
    // UUID v4 regex: 8-4-4-4-12 hex chars
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it('should generate installments without saleId (filled by context)', () => {
    const installments = generateInstallments(300, 3, '2026-01-01');
    expect(installments).toHaveLength(3);
    // saleId should be empty initially
    installments.forEach(inst => {
      expect(inst.saleId).toBe('');
    });
  });

  it('should simulate context filling saleId before saving', () => {
    const installments = generateInstallments(300, 2, '2026-04-15');
    const saleId = generateId();
    
    // Simulate what context does
    const updatedInstallments = installments.map(inst => ({
      ...inst,
      saleId,
    }));

    updatedInstallments.forEach(inst => {
      expect(inst.saleId).toBe(saleId);
    });
  });
});
