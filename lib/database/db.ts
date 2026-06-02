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
  unitCost: number | null;
  totalCost: number | null;
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
    `INSERT INTO stock_movements (id, productId, quantity, type, referenceId, notes, createdAt, isDeleted, unitCost, totalCost)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    sanitizeParams([movement.id, movement.productId, movement.quantity, movement.type,
      movement.referenceId, movement.notes, movement.createdAt, movement.unitCost, movement.totalCost])
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
// PRODUCT TAGS (junction table)
// ============================================================

export async function getProductTags(productId: string): Promise<string[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ tagId: string }>(
    'SELECT tagId FROM product_tags WHERE productId = ?',
    [productId]
  );
  return rows.map(r => r.tagId);
}

export async function setProductTags(productId: string, tagIds: string[]): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM product_tags WHERE productId = ?', [productId]);
  for (const tagId of tagIds) {
    await database.runAsync(
      'INSERT OR IGNORE INTO product_tags (productId, tagId) VALUES (?, ?)',
      [productId, tagId]
    );
  }
}

export async function deleteProductTags(productId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM product_tags WHERE productId = ?', [productId]);
}

// ============================================================
// CLIENT TAGS (junction table)
// ============================================================

export async function getClientTags(clientId: string): Promise<string[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ tagId: string }>(
    'SELECT tagId FROM client_tags WHERE clientId = ?',
    [clientId]
  );
  return rows.map(r => r.tagId);
}

export async function setClientTags(clientId: string, tagIds: string[]): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM client_tags WHERE clientId = ?', [clientId]);
  for (const tagId of tagIds) {
    await database.runAsync(
      'INSERT OR IGNORE INTO client_tags (clientId, tagId) VALUES (?, ?)',
      [clientId, tagId]
    );
  }
}

export async function deleteClientTags(clientId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM client_tags WHERE clientId = ?', [clientId]);
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
  averageCost: number;
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
       salePrice = ?, averageCost = ?, unit = ?, photoUri = ?, updatedAt = ? WHERE id = ? AND isDeleted = 0`,
      sanitizeParams([product.name, product.description, product.category, product.costPrice,
       product.salePrice, product.averageCost, product.unit, product.photoUri, product.updatedAt, product.id])
    );
    return product;
  }
  await database.runAsync(
    `INSERT INTO products (id, name, description, category, costPrice, salePrice, 
     stock, averageCost, unit, photoUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sanitizeParams([product.id, product.name, product.description, product.category, product.costPrice,
     product.salePrice, product.stock, product.averageCost, product.unit, product.photoUri, product.createdAt, product.updatedAt])
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
  syncStatus: string | null;
  syncError: string | null;
  syncWarnings: string | null;
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
       tagIds = ?, updatedAt = ?, syncStatus = ?, syncError = ?, syncWarnings = ? WHERE id = ?`,
      sanitizeParams([sale.description, sale.clientId, sale.clientName, sale.paymentType,
       sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
       sale.totalAmount, sale.entryAmount, sale.entryPaymentType, sale.status, sale.saleDate, sale.firstInstallmentDate,
       sale.tagIds, sale.updatedAt, sale.syncStatus, sale.syncError, sale.syncWarnings, sale.id])
    );
    return sale;
  }
  await database.runAsync(
    `INSERT INTO sales (id, description, clientId, clientName, paymentType, installmentsCount, 
     subtotal, discountType, discountValue, totalAmount, entryAmount, entryPaymentType, status, saleDate, firstInstallmentDate, 
     tagIds, createdAt, updatedAt, syncStatus, syncError, syncWarnings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sanitizeParams([sale.id, sale.description, sale.clientId, sale.clientName, sale.paymentType,
     sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
     sale.totalAmount, sale.entryAmount, sale.entryPaymentType, sale.status, sale.saleDate, sale.firstInstallmentDate,
     sale.tagIds, sale.createdAt, sale.updatedAt, sale.syncStatus || 'pending', sale.syncError, sale.syncWarnings])
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
  costAtSale: number | null;
  profitAmount: number | null;
  status: string | null;
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
       unitPrice = ?, totalPrice = ?, costAtSale = ?, profitAmount = ?, status = ?, isDeleted = 0 WHERE id = ?`,
      sanitizeParams([item.saleId, item.productId, item.productName, item.quantity,
        item.unitPrice, item.totalPrice, item.costAtSale, item.profitAmount, item.status || 'active', item.id])
    );
  } else {
    await database.runAsync(
      `INSERT INTO sale_items (id, saleId, productId, productName, quantity, unitPrice, totalPrice, costAtSale, profitAmount, status, isDeleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)`,
      sanitizeParams([item.id, item.saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.costAtSale, item.profitAmount])
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
  type: string;
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
       dueDate = ?, paidDate = ?, status = ?, history = ?, type = ?, isDeleted = 0 WHERE id = ?`,
      sanitizeParams([installment.saleId, installment.number, installment.totalInstallments,
        installment.amount, installment.dueDate, installment.paidDate, installment.status,
        installment.history, installment.type || 'normal', installment.id])
    );
  } else {
    await database.runAsync(
      `INSERT INTO installments (id, saleId, number, totalInstallments, amount, 
       dueDate, paidDate, status, history, type, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      sanitizeParams([installment.id, installment.saleId, installment.number, installment.totalInstallments,
        installment.amount, installment.dueDate, installment.paidDate, installment.status, installment.history, installment.type || 'normal'])
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
// SUPPLIERS
// ============================================================
export interface DbSupplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  website: string | null;
  pix: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
}

export async function getSuppliers(): Promise<DbSupplier[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSupplier>('SELECT * FROM suppliers WHERE isDeleted = 0 ORDER BY name');
  return rows;
}

export async function getSupplierById(id: string): Promise<DbSupplier | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbSupplier>('SELECT * FROM suppliers WHERE id = ? AND isDeleted = 0', [id]);
  return row || undefined;
}

export async function saveSupplier(supplier: DbSupplier): Promise<DbSupplier> {
  const database = await getDb();
  const existing = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM suppliers WHERE id = ?', [supplier.id]
  );
  if (existing) {
    await database.runAsync(
      `UPDATE suppliers SET name = ?, phone = ?, email = ?, notes = ?,
       website = ?, pix = ?, address = ?, updatedAt = ? WHERE id = ? AND isDeleted = 0`,
      sanitizeParams([supplier.name, supplier.phone, supplier.email, supplier.notes,
        supplier.website, supplier.pix, supplier.address, supplier.updatedAt, supplier.id])
    );
    return supplier;
  }
  await database.runAsync(
    `INSERT INTO suppliers (id, name, phone, email, notes, website, pix, address, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    sanitizeParams([supplier.id, supplier.name, supplier.phone, supplier.email, supplier.notes,
      supplier.website, supplier.pix, supplier.address, supplier.createdAt, supplier.updatedAt])
  );
  return supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE suppliers SET isDeleted = 1, updatedAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function mergeSuppliers(suppliers: any[]): Promise<void> {
  const database = await getDb();
  for (const supplier of suppliers) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM suppliers WHERE id = ?', [supplier.id]
    );
    if (existing) {
      await database.runAsync(
        `UPDATE suppliers SET name = ?, phone = ?, email = ?, notes = ?,
         website = ?, pix = ?, address = ?, updatedAt = ?, isDeleted = 0 WHERE id = ?`,
        sanitizeParams([
          supplier.name, supplier.phone || null, supplier.email || null, supplier.notes || null,
          supplier.website || null, supplier.pix || null, supplier.address || null,
          supplier.updatedAt || new Date().toISOString(), supplier.id,
        ])
      );
    } else {
      await database.runAsync(
        `INSERT INTO suppliers (id, name, phone, email, notes, website, pix, address, createdAt, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        sanitizeParams([
          supplier.id, supplier.name, supplier.phone || null, supplier.email || null, supplier.notes || null,
          supplier.website || null, supplier.pix || null, supplier.address || null,
          supplier.createdAt || new Date().toISOString(),
          supplier.updatedAt || new Date().toISOString(),
        ])
      );
    }
  }
  const ids = suppliers.map((s: any) => s.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await database.runAsync(
      `UPDATE suppliers SET isDeleted = 1 WHERE id NOT IN (${placeholders}) AND isDeleted = 0`,
      sanitizeParams(ids)
    );
  }
}

// ============================================================
// STOCK HELPERS (averageCost)
// ============================================================

export async function getProductStockWithCost(productId: string): Promise<{ stock: number; averageCost: number }> {
  const database = await getDb();
  const stock = await getProductStock(productId);
  const product = await database.getFirstAsync<{ averageCost: number }>(
    'SELECT averageCost FROM products WHERE id = ?',
    [productId]
  );
  return { stock, averageCost: product?.averageCost ?? 0 };
}

export async function updateAverageCost(productId: string): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ totalCost: number; totalQty: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type IN ('in','initial') THEN coalesce(totalCost, 0) ELSE 0 END), 0) as totalCost,
       COALESCE(SUM(CASE WHEN type IN ('in','initial') THEN quantity ELSE 0 END), 0) as totalQty
     FROM stock_movements
     WHERE productId = ? AND isDeleted = 0`,
    [productId]
  );
  const totalCost = result?.totalCost ?? 0;
  const totalQty = result?.totalQty ?? 0;
  const newAverageCost = totalQty > 0 ? totalCost / totalQty : 0;

  await database.runAsync(
    'UPDATE products SET averageCost = ? WHERE id = ?',
    [newAverageCost, productId]
  );

  return newAverageCost;
}

// ============================================================
// MERGE HELPERS (for sync pull from desktop)
// ============================================================

export async function mergeProducts(products: any[]): Promise<void> {
  const database = await getDb();

  for (const product of products) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM products WHERE id = ?', [product.id]
    );
    if (existing) {
      await database.runAsync(
        `UPDATE products SET name = ?, description = ?, category = ?, costPrice = ?,
         salePrice = ?, averageCost = ?, stock = ?, unit = ?, photoUri = ?, updatedAt = ?, isDeleted = 0
         WHERE id = ?`,
        sanitizeParams([
          product.name, product.description || null, product.category || null,
          product.costPrice || 0, product.salePrice || 0, product.averageCost || 0, product.stock || 0,
          product.unit || null, product.photoUri || null,
          product.updatedAt || new Date().toISOString(), product.id,
        ])
      );
    } else {
      await database.runAsync(
        `INSERT INTO products (id, name, description, category, costPrice, salePrice,
         stock, averageCost, unit, photoUri, createdAt, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        sanitizeParams([
          product.id, product.name, product.description || null, product.category || null,
          product.costPrice || 0, product.salePrice || 0, product.stock || 0, product.averageCost || 0,
          product.unit || null, product.photoUri || null,
          product.createdAt || new Date().toISOString(),
          product.updatedAt || new Date().toISOString(),
        ])
      );
    }

    // Sync product_tags
    if (product.tagIds && Array.isArray(product.tagIds)) {
      await database.runAsync('DELETE FROM product_tags WHERE productId = ?', [product.id]);
      for (const tagId of product.tagIds) {
        await database.runAsync(
          'INSERT OR IGNORE INTO product_tags (productId, tagId) VALUES (?, ?)',
          [product.id, tagId]
        );
      }
    }
  }

  const ids = products.map((p: any) => p.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await database.runAsync(
      `UPDATE products SET isDeleted = 1 WHERE id NOT IN (${placeholders}) AND isDeleted = 0`,
      sanitizeParams(ids)
    );
  }
}

export async function mergeClients(clients: any[]): Promise<void> {
  const database = await getDb();

  for (const client of clients) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM clients WHERE id = ?', [client.id]
    );
    if (existing) {
      await database.runAsync(
        `UPDATE clients SET name = ?, document = ?, phone = ?, email = ?,
         address = ?, notes = ?, updatedAt = ?, isDeleted = 0 WHERE id = ?`,
        sanitizeParams([
          client.name, client.document || null, client.phone || null,
          client.email || null, client.address || null, client.notes || null,
          client.updatedAt || new Date().toISOString(), client.id,
        ])
      );
    } else {
      await database.runAsync(
        `INSERT INTO clients (id, name, document, phone, email, address, notes, createdAt, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        sanitizeParams([
          client.id, client.name, client.document || null, client.phone || null,
          client.email || null, client.address || null, client.notes || null,
          client.createdAt || new Date().toISOString(),
          client.updatedAt || new Date().toISOString(),
        ])
      );
    }

    // Sync client_tags
    if (client.tagIds && Array.isArray(client.tagIds)) {
      await database.runAsync('DELETE FROM client_tags WHERE clientId = ?', [client.id]);
      for (const tagId of client.tagIds) {
        await database.runAsync(
          'INSERT OR IGNORE INTO client_tags (clientId, tagId) VALUES (?, ?)',
          [client.id, tagId]
        );
      }
    }
  }

  const ids = clients.map((c: any) => c.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await database.runAsync(
      `UPDATE clients SET isDeleted = 1 WHERE id NOT IN (${placeholders}) AND isDeleted = 0`,
      sanitizeParams(ids)
    );
  }
}

export async function mergeTags(tags: any[]): Promise<void> {
  const database = await getDb();

  for (const tag of tags) {
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM tags WHERE id = ?', [tag.id]
    );
    if (existing) {
      await database.runAsync(
        `UPDATE tags SET name = ?, color = ?, isDeleted = 0 WHERE id = ?`,
        sanitizeParams([tag.name, tag.color || '#3B82F6', tag.id])
      );
    } else {
      await database.runAsync(
        `INSERT INTO tags (id, name, color, createdAt, isDeleted)
         VALUES (?, ?, ?, ?, 0)`,
        sanitizeParams([
          tag.id, tag.name, tag.color || '#3B82F6',
          tag.createdAt || new Date().toISOString(),
        ])
      );
    }
  }

  const ids = tags.map((t: any) => t.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await database.runAsync(
      `UPDATE tags SET isDeleted = 1 WHERE id NOT IN (${placeholders}) AND isDeleted = 0`,
      sanitizeParams(ids)
    );
  }
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