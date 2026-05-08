import * as SQLite from 'expo-sqlite';
import { migrations, LATEST_VERSION } from './schema';

// Sanitiza parâmetros para expo-sqlite (Android rejeita undefined)
function sanitizeParams(params: any[]): any[] {
  return params.map(p => p === undefined ? null : p);
}

// ============================================================
// Banco de Dados
// ============================================================

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('stock_sales.db');
  }
  return db;
}

// ============================================================
// Migrations
// ============================================================

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='db_version'"
    );

    let currentVersion = 0;
    if (tableCheck) {
      const result = await db.getFirstAsync<{ version: number }>(
        'SELECT COALESCE(MAX(version), 0) as version FROM db_version'
      );
      currentVersion = result?.version ?? 0;
    }

    if (currentVersion >= LATEST_VERSION) {
      return;
    }

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        await db.execAsync(migration.sql);
        await db.runAsync(
          'INSERT INTO db_version (version, appliedAt) VALUES (?, ?)',
          [migration.version, new Date().toISOString()]
        );
      }
    }
  } catch (error) {
    console.error('[Database] Erro ao executar migrations:', error);
  }
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export interface DbStockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  isDeleted: number;
}

export async function getStockMovementsByProduct(productId: string): Promise<DbStockMovement[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbStockMovement>(
    'SELECT * FROM stock_movements WHERE productId = ? AND isDeleted = 0 ORDER BY createdAt',
    [productId]
  );
  return rows;
}

export async function saveStockMovement(movement: DbStockMovement): Promise<DbStockMovement> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO stock_movements (id, productId, quantity, type, referenceId, notes, createdAt, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    sanitizeParams([movement.id, movement.productId, movement.quantity, movement.type,
      movement.referenceId, movement.notes, movement.createdAt])
  );
  return movement;
}

export async function deleteStockMovementsByReference(referenceId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE stock_movements SET isDeleted = 1 WHERE referenceId = ?',
    [referenceId]
  );
}

export async function getProductStock(productId: string): Promise<number> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ stock: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type IN ('in','initial') THEN quantity ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END), 0) as stock
     FROM stock_movements
     WHERE productId = ? AND isDeleted = 0`,
    [productId]
  );
  return row?.stock ?? 0;
}

// ============================================================
// TAGS
// ============================================================
export interface DbTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export async function getTags(): Promise<DbTag[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbTag>('SELECT * FROM tags WHERE isDeleted = 0 ORDER BY name');
  return rows;
}

export async function getTagById(id: string): Promise<DbTag | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbTag>('SELECT * FROM tags WHERE id = ? AND isDeleted = 0', [id]);
  return row || undefined;
}

export async function saveTag(tag: DbTag): Promise<DbTag> {
  const database = await getDb();
  const existing = await getTagById(tag.id);
  if (existing) {
    await database.runAsync(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      sanitizeParams([tag.name, tag.color, tag.id])
    );
    return tag;
  }
  await database.runAsync(
    'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
    sanitizeParams([tag.id, tag.name, tag.color, tag.createdAt])
  );
  return tag;
}

export async function deleteTag(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE tags SET isDeleted = 1 WHERE id = ?',
    [id]
  );
}

// ============================================================
// PRODUCTS
// ============================================================
export interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  unit: string | null;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProducts(): Promise<DbProduct[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbProduct>(
    'SELECT p.*, COALESCE((SELECT SUM(CASE WHEN sm.type IN (\'in\',\'initial\') THEN sm.quantity ELSE 0 END) - SUM(CASE WHEN sm.type = \'out\' THEN sm.quantity ELSE 0 END) FROM stock_movements sm WHERE sm.productId = p.id AND sm.isDeleted = 0), 0) as stock FROM products p WHERE p.isDeleted = 0 ORDER BY p.name'
  );
  return rows;
}

export async function getProductById(id: string): Promise<DbProduct | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbProduct>(
    'SELECT p.*, COALESCE((SELECT SUM(CASE WHEN sm.type IN (\'in\',\'initial\') THEN sm.quantity ELSE 0 END) - SUM(CASE WHEN sm.type = \'out\' THEN sm.quantity ELSE 0 END) FROM stock_movements sm WHERE sm.productId = p.id AND sm.isDeleted = 0), 0) as stock FROM products p WHERE p.id = ? AND p.isDeleted = 0',
    [id]
  );
  return row || undefined;
}

export async function saveProduct(product: DbProduct): Promise<DbProduct> {
  const database = await getDb();
  const existing = await database.getFirstAsync<DbProduct>('SELECT * FROM products WHERE id = ?', [product.id]);
  if (existing) {
    await database.runAsync(
      `UPDATE products SET name = ?, description = ?, category = ?, costPrice = ?, 
       salePrice = ?, unit = ?, photoUri = ?, updatedAt = ? WHERE id = ? AND isDeleted = 0`,
      sanitizeParams([product.name, product.description, product.category, product.costPrice,
       product.salePrice, product.unit, product.photoUri, product.updatedAt, product.id])
    );
    return product;
  }
  await database.runAsync(
    `INSERT INTO products (id, name, description, category, costPrice, salePrice, 
     stock, unit, photoUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sanitizeParams([product.id, product.name, product.description, product.category, product.costPrice,
     product.salePrice, product.stock, product.unit, product.photoUri, product.createdAt, product.updatedAt])
  );
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE products SET isDeleted = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

// ============================================================
// CLIENTS
// ============================================================
export interface DbClient {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getClients(): Promise<DbClient[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbClient>('SELECT * FROM clients WHERE isDeleted = 0 ORDER BY name');
  return rows;
}

export async function getClientById(id: string): Promise<DbClient | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbClient>('SELECT * FROM clients WHERE id = ? AND isDeleted = 0', [id]);
  return row || undefined;
}

export async function saveClient(client: DbClient): Promise<DbClient> {
  const database = await getDb();
  const existing = await getClientById(client.id);
  if (existing) {
    await database.runAsync(
      `UPDATE clients SET name = ?, document = ?, phone = ?, email = ?, 
       address = ?, notes = ?, updatedAt = ? WHERE id = ?`,
      sanitizeParams([client.name, client.document, client.phone, client.email,
       client.address, client.notes, client.updatedAt, client.id])
    );
    return client;
  }
  await database.runAsync(
    `INSERT INTO clients (id, name, document, phone, email, address, notes, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sanitizeParams([client.id, client.name, client.document, client.phone, client.email,
     client.address, client.notes, client.createdAt, client.updatedAt])
  );
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE clients SET isDeleted = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

// ============================================================
// SALES
// ============================================================
export interface DbSale {
  id: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  paymentType: string;
  installmentsCount: number;
  subtotal: number;
  discountType: string | null;
  discountValue: number;
  totalAmount: number;
  entryAmount: number | null;
  entryPaymentType: string | null;
  status: string;
  saleDate: string;
  firstInstallmentDate: string | null;
  tagIds: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSales(): Promise<DbSale[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSale>('SELECT * FROM sales WHERE isDeleted = 0 ORDER BY saleDate DESC');
  return rows;
}

export async function getSaleById(id: string): Promise<DbSale | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbSale>('SELECT * FROM sales WHERE id = ? AND isDeleted = 0', [id]);
  return row || undefined;
}

export async function saveSale(sale: DbSale): Promise<DbSale> {
  const database = await getDb();
  const existing = await database.getFirstAsync<DbSale>('SELECT * FROM sales WHERE id = ?', [sale.id]);
  if (existing) {
    await database.runAsync(
      `UPDATE sales SET description = ?, clientId = ?, clientName = ?, paymentType = ?, 
       installmentsCount = ?, subtotal = ?, discountType = ?, discountValue = ?, 
       totalAmount = ?, entryAmount = ?, entryPaymentType = ?, status = ?, saleDate = ?, firstInstallmentDate = ?, 
       tagIds = ?, updatedAt = ? WHERE id = ?`,
      sanitizeParams([sale.description, sale.clientId, sale.clientName, sale.paymentType,
       sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
       sale.totalAmount, sale.entryAmount, sale.entryPaymentType, sale.status, sale.saleDate, sale.firstInstallmentDate,
       sale.tagIds, sale.updatedAt, sale.id])
    );
    return sale;
  }
  await database.runAsync(
    `INSERT INTO sales (id, description, clientId, clientName, paymentType, installmentsCount, 
     subtotal, discountType, discountValue, totalAmount, entryAmount, entryPaymentType, status, saleDate, firstInstallmentDate, 
     tagIds, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sanitizeParams([sale.id, sale.description, sale.clientId, sale.clientName, sale.paymentType,
     sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
     sale.totalAmount, sale.entryAmount, sale.entryPaymentType, sale.status, sale.saleDate, sale.firstInstallmentDate,
     sale.tagIds, sale.createdAt, sale.updatedAt])
  ); 
  return sale;
}

export async function deleteSale(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE sales SET isDeleted = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

// ============================================================
// SALE ITEMS
// ============================================================
export interface DbSaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export async function getSaleItems(saleId: string): Promise<DbSaleItem[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSaleItem>(
    'SELECT * FROM sale_items WHERE saleId = ? AND isDeleted = 0',
    [saleId]
  );
  return rows;
}

export async function saveSaleItem(item: DbSaleItem): Promise<DbSaleItem> {
  const database = await getDb();
  const existing = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM sale_items WHERE id = ?', [item.id]
  );
  if (existing) {
    await database.runAsync(
      `UPDATE sale_items SET saleId = ?, productId = ?, productName = ?, quantity = ?, 
       unitPrice = ?, totalPrice = ?, isDeleted = 0 WHERE id = ?`,
      sanitizeParams([item.saleId, item.productId, item.productName, item.quantity,
        item.unitPrice, item.totalPrice, item.id])
    );
  } else {
    await database.runAsync(
      `INSERT INTO sale_items (id, saleId, productId, productName, quantity, unitPrice, totalPrice, isDeleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      sanitizeParams([item.id, item.saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice])
    );
  }
  return item;
}

export async function deleteSaleItems(saleId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE sale_items SET isDeleted = 1 WHERE saleId = ?',
    [saleId]
  );
}

// ============================================================
// INSTALLMENTS
// ============================================================
export interface DbInstallment {
  id: string;
  saleId: string;
  number: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  history: string;
}

export async function getInstallments(saleId: string): Promise<DbInstallment[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbInstallment>(
    'SELECT * FROM installments WHERE saleId = ? AND isDeleted = 0 ORDER BY number',
    [saleId]
  );
  return rows;
}

export async function saveInstallment(installment: DbInstallment): Promise<DbInstallment> {
  const database = await getDb();
  const existing = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM installments WHERE id = ?', [installment.id]
  );
  if (existing) {
    await database.runAsync(
      `UPDATE installments SET saleId = ?, number = ?, totalInstallments = ?, amount = ?, 
       dueDate = ?, paidDate = ?, status = ?, history = ?, isDeleted = 0 WHERE id = ?`,
      sanitizeParams([installment.saleId, installment.number, installment.totalInstallments,
        installment.amount, installment.dueDate, installment.paidDate, installment.status,
        installment.history, installment.id])
    );
  } else {
    await database.runAsync(
      `INSERT INTO installments (id, saleId, number, totalInstallments, amount, 
       dueDate, paidDate, status, history, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      sanitizeParams([installment.id, installment.saleId, installment.number, installment.totalInstallments,
        installment.amount, installment.dueDate, installment.paidDate, installment.status, installment.history])
    );
  }
  return installment;
}

export async function deleteInstallments(saleId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE installments SET isDeleted = 1 WHERE saleId = ?',
    [saleId]
  );
}

// ============================================================
// SETTINGS
// ============================================================
export interface DbSetting {
  key: string;
  value: string | null;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbSetting>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    sanitizeParams([key, value])
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSetting>('SELECT * FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
}