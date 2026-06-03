-- ============================================================
-- Migration: Convert all date columns from INTEGER to TEXT (ISO strings)
-- Version: 003
-- Date: 2026-05-07
-- Purpose: Align with Desktop version for future sync compatibility
-- ============================================================

-- ============================================================
-- TAGS: createdAt INTEGER -> TEXT
-- ============================================================
CREATE TABLE tags_new (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

INSERT INTO tags_new (id, name, color, createdAt)
SELECT id, name, color, datetime(createdAt/1000, 'unixepoch') FROM tags;

DROP TABLE tags;
ALTER TABLE tags_new RENAME TO tags;

-- ============================================================
-- PRODUCTS: createdAt INTEGER -> TEXT, updatedAt INTEGER -> TEXT
-- ============================================================
CREATE TABLE products_new (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  costPrice REAL NOT NULL DEFAULT 0,
  salePrice REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un',
  photoUri TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

INSERT INTO products_new (id, name, description, category, costPrice, salePrice, stock, unit, photoUri, createdAt, updatedAt)
SELECT id, name, description, category, costPrice, salePrice, stock, unit, photoUri,
       datetime(createdAt/1000, 'unixepoch'),
       datetime(updatedAt/1000, 'unixepoch')
FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- ============================================================
-- CLIENTS: createdAt INTEGER -> TEXT, updatedAt INTEGER -> TEXT
-- ============================================================
CREATE TABLE clients_new (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

INSERT INTO clients_new (id, name, document, phone, email, address, notes, createdAt, updatedAt)
SELECT id, name, document, phone, email, address, notes,
       datetime(createdAt/1000, 'unixepoch'),
       datetime(updatedAt/1000, 'unixepoch')
FROM clients;

DROP TABLE clients;
ALTER TABLE clients_new RENAME TO clients;

-- ============================================================
-- SALES: saleDate INTEGER -> TEXT, firstInstallmentDate INTEGER -> TEXT,
--        createdAt INTEGER -> TEXT, updatedAt INTEGER -> TEXT
-- ============================================================
CREATE TABLE sales_new (
  id TEXT PRIMARY KEY NOT NULL,
  description TEXT,
  clientId TEXT,
  clientName TEXT,
  paymentType TEXT NOT NULL,
  installmentsCount INTEGER NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL DEFAULT 0,
  discountType TEXT,
  discountValue REAL NOT NULL DEFAULT 0,
  totalAmount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  saleDate TEXT NOT NULL,
  firstInstallmentDate TEXT,
  tagIds TEXT DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL
);

INSERT INTO sales_new (id, description, clientId, clientName, paymentType, installmentsCount,
                        subtotal, discountType, discountValue, totalAmount, status,
                        saleDate, firstInstallmentDate, tagIds, createdAt, updatedAt)
SELECT id, description, clientId, clientName, paymentType, installmentsCount,
       subtotal, discountType, discountValue, totalAmount, status,
       datetime(saleDate/1000, 'unixepoch'),
       CASE WHEN firstInstallmentDate IS NOT NULL THEN datetime(firstInstallmentDate/1000, 'unixepoch') ELSE NULL END,
       tagIds,
       datetime(createdAt/1000, 'unixepoch'),
       datetime(updatedAt/1000, 'unixepoch')
FROM sales;

DROP TABLE sales;
ALTER TABLE sales_new RENAME TO sales;

-- ============================================================
-- INSTALLMENTS: dueDate INTEGER -> TEXT, paidDate INTEGER -> TEXT
-- ============================================================
CREATE TABLE installments_new (
  id TEXT PRIMARY KEY NOT NULL,
  saleId TEXT NOT NULL,
  number INTEGER NOT NULL,
  totalInstallments INTEGER NOT NULL,
  amount REAL NOT NULL,
  dueDate TEXT NOT NULL,
  paidDate TEXT,
  status TEXT NOT NULL,
  history TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
);

INSERT INTO installments_new (id, saleId, number, totalInstallments, amount, dueDate, paidDate, status, history)
SELECT id, saleId, number, totalInstallments, amount,
       datetime(dueDate/1000, 'unixepoch'),
       CASE WHEN paidDate IS NOT NULL THEN datetime(paidDate/1000, 'unixepoch') ELSE NULL END,
       status, history
FROM installments;

DROP TABLE installments;
ALTER TABLE installments_new RENAME TO installments;

-- ============================================================
-- Recreate indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(saleDate);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(clientId);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(saleId);
CREATE INDEX IF NOT EXISTS idx_installments_sale ON installments(saleId);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installments(dueDate);
