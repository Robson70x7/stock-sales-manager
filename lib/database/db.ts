import * as SQLite from 'expo-sqlite';

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
// TAGS
// ============================================================
export interface DbTag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export async function getTags(): Promise<DbTag[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbTag>('SELECT * FROM tags ORDER BY name');
  return rows;
}

export async function getTagById(id: string): Promise<DbTag | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbTag>('SELECT * FROM tags WHERE id = ?', [id]);
  return row || undefined;
}

export async function saveTag(tag: DbTag): Promise<DbTag> {
  const database = await getDb();
  const existing = await getTagById(tag.id);
  if (existing) {
    await database.runAsync(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [tag.name, tag.color, tag.id]
    );
    return tag;
  }
  await database.runAsync(
    'INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)',
    [tag.id, tag.name, tag.color, tag.createdAt]
  );
  return tag;
}

export async function deleteTag(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM tags WHERE id = ?', [id]);
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
  createdAt: number;
  updatedAt: number;
}

export async function getProducts(): Promise<DbProduct[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbProduct>('SELECT * FROM products ORDER BY name');
  return rows;
}

export async function getProductById(id: string): Promise<DbProduct | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbProduct>('SELECT * FROM products WHERE id = ?', [id]);
  return row || undefined;
}

export async function saveProduct(product: DbProduct): Promise<DbProduct> {
  const database = await getDb();
  const existing = await getProductById(product.id);
  if (existing) {
    await database.runAsync(
      `UPDATE products SET name = ?, description = ?, category = ?, costPrice = ?, 
       salePrice = ?, stock = ?, unit = ?, photoUri = ?, updatedAt = ? WHERE id = ?`,
      [product.name, product.description, product.category, product.costPrice,
       product.salePrice, product.stock, product.unit, product.photoUri, product.updatedAt, product.id]
    );
    return product;
  }
  await database.runAsync(
    `INSERT INTO products (id, name, description, category, costPrice, salePrice, 
     stock, unit, photoUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [product.id, product.name, product.description, product.category, product.costPrice,
     product.salePrice, product.stock, product.unit, product.photoUri, product.createdAt, product.updatedAt]
  );
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

export async function updateProductStock(id: string, quantity: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?',
    [quantity, Date.now(), id]
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
  createdAt: number;
  updatedAt: number;
}

export async function getClients(): Promise<DbClient[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbClient>('SELECT * FROM clients ORDER BY name');
  return rows;
}

export async function getClientById(id: string): Promise<DbClient | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbClient>('SELECT * FROM clients WHERE id = ?', [id]);
  return row || undefined;
}

export async function saveClient(client: DbClient): Promise<DbClient> {
  const database = await getDb();
  const existing = await getClientById(client.id);
  if (existing) {
    await database.runAsync(
      `UPDATE clients SET name = ?, document = ?, phone = ?, email = ?, 
       address = ?, notes = ?, updatedAt = ? WHERE id = ?`,
      [client.name, client.document, client.phone, client.email,
       client.address, client.notes, client.updatedAt, client.id]
    );
    return client;
  }
  await database.runAsync(
    `INSERT INTO clients (id, name, document, phone, email, address, notes, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [client.id, client.name, client.document, client.phone, client.email,
     client.address, client.notes, client.createdAt, client.updatedAt]
  );
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM clients WHERE id = ?', [id]);
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
  status: string;
  saleDate: number;
  firstInstallmentDate: number | null;
  tagIds: string;
  createdAt: number;
  updatedAt: number;
}

export async function getSales(): Promise<DbSale[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSale>('SELECT * FROM sales ORDER BY saleDate DESC');
  return rows;
}

export async function getSaleById(id: string): Promise<DbSale | undefined> {
  const database = await getDb();
  const row = await database.getFirstAsync<DbSale>('SELECT * FROM sales WHERE id = ?', [id]);
  return row || undefined;
}

export async function saveSale(sale: DbSale): Promise<DbSale> {
  const database = await getDb();
  const existing = await getSaleById(sale.id);
  if (existing) {
    await database.runAsync(
      `UPDATE sales SET description = ?, clientId = ?, clientName = ?, paymentType = ?, 
       installmentsCount = ?, subtotal = ?, discountType = ?, discountValue = ?, 
       totalAmount = ?, status = ?, saleDate = ?, firstInstallmentDate = ?, 
       tagIds = ?, updatedAt = ? WHERE id = ?`,
      [sale.description, sale.clientId, sale.clientName, sale.paymentType,
       sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
       sale.totalAmount, sale.status, sale.saleDate, sale.firstInstallmentDate,
       sale.tagIds, sale.updatedAt, sale.id]
    );
    return sale;
  }
  await database.runAsync(
    `INSERT INTO sales (id, description, clientId, clientName, paymentType, installmentsCount, 
     subtotal, discountType, discountValue, totalAmount, status, saleDate, firstInstallmentDate, 
     tagIds, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sale.id, sale.description, sale.clientId, sale.clientName, sale.paymentType,
     sale.installmentsCount, sale.subtotal, sale.discountType, sale.discountValue,
     sale.totalAmount, sale.status, sale.saleDate, sale.firstInstallmentDate,
     sale.tagIds, sale.createdAt, sale.updatedAt]
  );
  return sale;
}

export async function deleteSale(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM sales WHERE id = ?', [id]);
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
    'SELECT * FROM sale_items WHERE saleId = ?',
    [saleId]
  );
  return rows;
}

export async function saveSaleItem(item: DbSaleItem): Promise<DbSaleItem> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO sale_items (id, saleId, productId, productName, quantity, unitPrice, totalPrice) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice]
  );
  return item;
}

export async function deleteSaleItems(saleId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM sale_items WHERE saleId = ?', [saleId]);
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
  dueDate: number;
  paidDate: number | null;
  status: string;
  history: string;
}

export async function getInstallments(saleId: string): Promise<DbInstallment[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbInstallment>(
    'SELECT * FROM installments WHERE saleId = ? ORDER BY number',
    [saleId]
  );
  return rows;
}

export async function saveInstallment(installment: DbInstallment): Promise<DbInstallment> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO installments (id, saleId, number, totalInstallments, amount, 
     dueDate, paidDate, status, history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [installment.id, installment.saleId, installment.number, installment.totalInstallments,
     installment.amount, installment.dueDate, installment.paidDate, installment.status, installment.history]
  );
  return installment;
}

export async function deleteInstallments(saleId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM installments WHERE saleId = ?', [saleId]);
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
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const database = await getDb();
  const rows = await database.getAllAsync<DbSetting>('SELECT * FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, r.value ?? '']));
}