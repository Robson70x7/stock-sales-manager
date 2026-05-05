-- ============================================================
-- Schema inicial do app VendaFácil Mobile
-- Versão: 001
-- Data: 2026-05-04
-- ============================================================

-- Tabela de controle de versão do banco
CREATE TABLE IF NOT EXISTS db_version (
    version INTEGER PRIMARY KEY,
    appliedAt TEXT NOT NULL
);

-- Tags (categorias)
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    createdAt INTEGER NOT NULL
);

-- Produtos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    costPrice REAL NOT NULL DEFAULT 0,
    salePrice REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'un',
    photoUri TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Vendas
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY NOT NULL,
    description TEXT,
    clientId TEXT,
    clientName TEXT,
    paymentType TEXT NOT NULL,
    installmentsCount INTEGER NOT NULL DEFAULT 1,
    subtotal REAL NOT NULL,
    discountType TEXT,
    discountValue REAL NOT NULL DEFAULT 0,
    totalAmount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    saleDate INTEGER NOT NULL,
    firstInstallmentDate INTEGER,
    tagIds TEXT DEFAULT '[]',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

-- Itens de venda
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY NOT NULL,
    saleId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    totalPrice REAL NOT NULL
);

-- Parcelas
CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY NOT NULL,
    saleId TEXT NOT NULL,
    number INTEGER NOT NULL,
    totalInstallments INTEGER NOT NULL,
    amount REAL NOT NULL,
    dueDate INTEGER NOT NULL,
    paidDate INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    history TEXT DEFAULT '[]'
);

-- Configurações do app
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
);

-- Inserir versão inicial
INSERT INTO db_version (version, appliedAt) VALUES (1, datetime('now'));