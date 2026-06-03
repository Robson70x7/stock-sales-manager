-- ============================================================
-- Migration: Add stock movements, isDeleted, entryAmount
-- Version: 004
-- Date: 2026-05-08
-- ============================================================

-- ============================================================
-- STOCK MOVEMENTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY NOT NULL,
  productId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('in','out','initial','adjustment')),
  referenceId TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  isDeleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(productId);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(referenceId);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);

-- ============================================================
-- Migrate current stock as 'initial' movements
-- ============================================================
INSERT INTO stock_movements (id, productId, quantity, type, referenceId, notes, createdAt, isDeleted)
SELECT
  hex(randomblob(16)),
  id,
  stock,
  'initial',
  NULL,
  'Estoque inicial (migração)',
  datetime('now'),
  0
FROM products
WHERE stock > 0;

-- ============================================================
-- Add isDeleted to existing tables
-- ============================================================
ALTER TABLE products ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tags ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE installments ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE settings ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Add entryAmount to sales
-- ============================================================
ALTER TABLE sales ADD COLUMN entryAmount REAL NOT NULL DEFAULT 0;
