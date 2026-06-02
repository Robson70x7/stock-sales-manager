-- ============================================================
-- Migration: Alinhamento de entidades com desktop
-- Version: 007
-- Date: 2026-06-02
-- Purpose: Add averageCost to products, create product_tags and client_tags junction tables
-- ============================================================

-- Add averageCost to products
ALTER TABLE products ADD COLUMN averageCost REAL NOT NULL DEFAULT 0;

-- Junction table: product <-> tag
CREATE TABLE IF NOT EXISTS product_tags (
  productId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (productId, tagId),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);

-- Junction table: client <-> tag
CREATE TABLE IF NOT EXISTS client_tags (
  clientId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (clientId, tagId),
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);

-- Suppliers table (matching desktop schema)
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  website TEXT,
  pix TEXT,
  address TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  isDeleted INTEGER NOT NULL DEFAULT 0
);

-- Add unitCost and totalCost to stock_movements for averageCost calculation
ALTER TABLE stock_movements ADD COLUMN unitCost REAL;
ALTER TABLE stock_movements ADD COLUMN totalCost REAL;
