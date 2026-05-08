import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Tag, Product, Client, Sale, SaleItem, Installment, StockMovement, AppSettings, PaymentType } from '@/types';
import * as db from '@/lib/database/db';
import { generateId } from '@/lib/utils';

// ============================================================
// Estado global
// ============================================================
interface AppState {
  tags: Tag[];
  products: Product[];
  clients: Client[];
  sales: Sale[];
  settings: AppSettings;
  isLoading: boolean;
}

const initialState: AppState = {
  tags: [],
  products: [],
  clients: [],
  sales: [],
  settings: { askReturnStockOnDelete: true },
  isLoading: true,
};

// ============================================================
// Actions
// ============================================================
type AppAction =
  | { type: 'LOAD_DATA'; payload: Omit<AppState, 'isLoading'> }
  | { type: 'SET_LOADING'; payload: boolean }
  // Tags
  | { type: 'ADD_TAG'; payload: Tag }
  | { type: 'UPDATE_TAG'; payload: Tag }
  | { type: 'DELETE_TAG'; payload: string }
  // Products
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  // Clients
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  // Sales
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'UPDATE_SALE'; payload: Sale }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'UPDATE_INSTALLMENT'; payload: { saleId: string; installment: Installment } }
  // Stock Movements
  | { type: 'UPDATE_PRODUCT_STOCK'; payload: { productId: string; stock: number } }
  // Settings
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    // Tags
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.payload] };
    case 'UPDATE_TAG':
      return { ...state, tags: state.tags.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TAG':
      return { ...state, tags: state.tags.filter(t => t.id !== action.payload) };
    // Products
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    // Clients
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
    // Sales
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'UPDATE_SALE':
      return { ...state, sales: state.sales.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SALE':
      return { ...state, sales: state.sales.filter(s => s.id !== action.payload) };
    case 'UPDATE_INSTALLMENT': {
      const { saleId, installment } = action.payload;
      return {
        ...state,
        sales: state.sales.map(s => {
          if (s.id !== saleId) return s;
          const updatedInstallments = s.installments.map(i =>
            i.id === installment.id ? installment : i
          );
          const allPaid = updatedInstallments.every(i => i.status === 'paid');
          const somePaid = updatedInstallments.some(i => i.status === 'paid');
          const newStatus = allPaid ? 'paid' : somePaid ? 'partial' : 'pending';
          return { ...s, installments: updatedInstallments, status: newStatus };
        }),
      };
    }
    case 'UPDATE_PRODUCT_STOCK':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, stock: action.payload.stock }
            : p
        ),
      };
    // Settings
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
interface AppContextType extends AppState {
  state: AppState;
  // Tags
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<Tag>;
  updateTag: (tag: Tag) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Sales
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Sale>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string, returnStock?: boolean) => Promise<void>;
  updateInstallment: (saleId: string, installment: Installment) => Promise<void>;
  // Stock Movements
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<StockMovement>;
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function toDbTag(tag: Tag): db.DbTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt,
  };
}

function fromDbTag(row: db.DbTag): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
  };
}

function toDbProduct(product: Product): db.DbProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description || null,
    category: product.category || null,
    costPrice: product.costPrice,
    salePrice: product.salePrice,
    stock: product.stock,
    unit: product.unit || null,
    photoUri: product.photoUri || null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function fromDbProduct(row: db.DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category || undefined,
    costPrice: row.costPrice,
    salePrice: row.salePrice,
    stock: row.stock,
    unit: row.unit || undefined,
    photoUri: row.photoUri || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDbClient(client: Client): db.DbClient {
  return {
    id: client.id,
    name: client.name,
    document: client.document || null,
    phone: client.phone || null,
    email: client.email || null,
    address: client.address || null,
    notes: client.notes || null,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

function fromDbClient(row: db.DbClient): Client {
  return {
    id: row.id,
    name: row.name,
    document: row.document || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    notes: row.notes || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDbSale(sale: Sale): db.DbSale {
  return {
    id: sale.id,
    description: sale.description || null,
    clientId: sale.clientId || null,
    clientName: sale.clientName || null,
    paymentType: sale.paymentType,
    installmentsCount: sale.installmentsCount,
    subtotal: sale.subtotal,
    discountType: sale.discountType || null,
    discountValue: sale.discountValue,
    totalAmount: sale.totalAmount,
    entryAmount: sale.entryAmount ?? null,
    entryPaymentType: sale.entryPaymentType || null,
    status: sale.status,
    saleDate: sale.saleDate,
    firstInstallmentDate: sale.firstInstallmentDate || null,
    tagIds: JSON.stringify(sale.tagIds),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}

function fromDbSale(row: db.DbSale, items: db.DbSaleItem[], installments: db.DbInstallment[]): Sale {
      return {
        id: row.id,
        description: row.description || undefined,
        clientId: row.clientId || undefined,
        clientName: row.clientName || undefined,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        subtotal: row.subtotal,
        discountType: row.discountType as Sale['discountType'] || null,
        discountValue: row.discountValue,
        totalAmount: row.totalAmount,
        entryAmount: row.entryAmount ?? undefined,
        entryPaymentType: row.entryPaymentType as PaymentType || undefined,
        paymentType: row.paymentType as Sale['paymentType'],
        status: row.status as Sale['status'],
        installmentsCount: row.installmentsCount,
        installments: installments.map(inst => ({
          id: inst.id,
          saleId: inst.saleId,
          number: inst.number,
          totalInstallments: inst.totalInstallments,
          amount: inst.amount,
          dueDate: inst.dueDate,
          paidDate: inst.paidDate || undefined,
          status: inst.status as Installment['status'],
          history: JSON.parse(inst.history || '[]'),
        })),
        tagIds: JSON.parse(row.tagIds || '[]'),
        saleDate: row.saleDate,
        firstInstallmentDate: row.firstInstallmentDate || undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
}

function toDbSaleItem(item: SaleItem, saleId: string): db.DbSaleItem {
  return {
    id: generateId(),
    saleId,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  };
}

function toDbInstallment(inst: Installment): db.DbInstallment {
  return {
    id: inst.id,
    saleId: inst.saleId,
    number: inst.number,
    totalInstallments: inst.totalInstallments,
    amount: inst.amount,
    dueDate: inst.dueDate,
    paidDate: inst.paidDate || null,
    status: inst.status,
    history: JSON.stringify(inst.history),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar dados do banco ao iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Inicializar banco (criar tabelas se não existirem)
      await db.getDb();

      // Carregar dados do banco
      const [dbTags, dbProducts, dbClients, dbSales, dbSettings] = await Promise.all([
        db.getTags(),
        db.getProducts(),
        db.getClients(),
        db.getSales(),
        db.getAllSettings(),
      ]);

      // Transformar e carregar vendas com items e parcelas
      const sales: Sale[] = await Promise.all(
        dbSales.map(async (saleRow) => {
          const items = await db.getSaleItems(saleRow.id);
          const installments = await db.getInstallments(saleRow.id);
          return fromDbSale(saleRow, items, installments);
        })
      );

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          tags: dbTags.map(fromDbTag),
          products: dbProducts.map(fromDbProduct),
          clients: dbClients.map(fromDbClient),
          sales,
          settings: dbSettings['app_settings'] 
            ? JSON.parse(dbSettings['app_settings']) 
            : { askReturnStockOnDelete: true },
        },
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ---- Tags ----
  const addTag = useCallback(async (tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> => {
    const now = new Date().toISOString();
    const tag: Tag = { ...tagData, id: generateId(), createdAt: now };

    dispatch({ type: 'ADD_TAG', payload: tag });
    await db.saveTag(toDbTag(tag));
    return tag;
  }, []);

  const updateTag = useCallback(async (tag: Tag) => {
    dispatch({ type: 'UPDATE_TAG', payload: tag });
    await db.saveTag(toDbTag(tag));
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_TAG', payload: id });
    await db.deleteTag(id);
  }, []);

  // ---- Products ----
  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const now = new Date().toISOString();
    const product: Product = { ...productData, id: generateId(), createdAt: now, updatedAt: now };

    dispatch({ type: 'ADD_PRODUCT', payload: product });
    await db.saveProduct(toDbProduct(product));
    return product;
  }, []);

  const updateProduct = useCallback(async (product: Product) => {
    const updated = { ...product, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
    await db.saveProduct(toDbProduct(updated));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
    await db.deleteProduct(id);
  }, []);

  // ---- Clients ----
  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const now = new Date().toISOString();
    const client: Client = { ...clientData, id: generateId(), createdAt: now, updatedAt: now };

    dispatch({ type: 'ADD_CLIENT', payload: client });
    await db.saveClient(toDbClient(client));
    return client;
  }, []);

  const updateClient = useCallback(async (client: Client) => {
    const updated = { ...client, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_CLIENT', payload: updated });
    await db.saveClient(toDbClient(updated));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
    await db.deleteClient(id);
  }, []);

  // ---- Stock Movements ----
  const addStockMovement = useCallback(async (
    movementData: Omit<StockMovement, 'id' | 'createdAt'>
  ): Promise<StockMovement> => {
    const now = new Date().toISOString();
    const movement: StockMovement = {
      ...movementData,
      id: generateId(),
      createdAt: now,
    };

    await db.saveStockMovement({
      id: movement.id,
      productId: movement.productId,
      quantity: movement.quantity,
      type: movement.type,
      referenceId: movement.referenceId || null,
      notes: movement.notes || null,
      createdAt: movement.createdAt,
      isDeleted: 0,
    });

    const newStock = await db.getProductStock(movement.productId);
    dispatch({ type: 'UPDATE_PRODUCT_STOCK', payload: { productId: movement.productId, stock: newStock } });

    return movement;
  }, []);

  // ---- Sales ----
  const addSale = useCallback(async (
    saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Sale> => {
    const now = new Date().toISOString();
    const id = generateId();
    
    const sale: Sale = {
      ...saleData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.saveSale(toDbSale(sale));

    // Salvar itens
    sale.items = sale.items.map(item => ({ ...item, saleId: sale.id }));
    for (const item of sale.items) {
      await db.saveSaleItem(toDbSaleItem(item, sale.id));
    }

    // Salvar parcelas
    sale.installments = sale.installments.map(inst => ({ ...inst, saleId: sale.id }));
    for (const inst of sale.installments) {
      await db.saveInstallment(toDbInstallment(inst));
    }

    // Criar stock_movements para cada item (type='out')
    for (const item of sale.items) {
      const movement: StockMovement = {
        id: generateId(),
        productId: item.productId,
        quantity: item.quantity,
        type: 'out',
        referenceId: sale.id,
        notes: `Venda #${sale.id.slice(0, 8)}`,
        createdAt: now,
      };
      await db.saveStockMovement({
        id: movement.id,
        productId: movement.productId,
        quantity: movement.quantity,
        type: movement.type,
        referenceId: movement.referenceId || null,
        notes: movement.notes || null,
        createdAt: movement.createdAt,
        isDeleted: 0,
      });

      // Atualizar cache de estoque local
      const newStock = await db.getProductStock(item.productId);
      dispatch({ type: 'UPDATE_PRODUCT_STOCK', payload: { productId: item.productId, stock: newStock } });
    }

    dispatch({ type: 'ADD_SALE', payload: sale });
    return sale;
  }, []);

  const updateSale = useCallback(async (sale: Sale) => {
    const updated = { ...sale, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_SALE', payload: updated });
    await db.saveSale(toDbSale(updated));

    await db.deleteSaleItems(sale.id);
    for (const item of sale.items) {
      await db.saveSaleItem(toDbSaleItem(item, sale.id));
    }
    await db.deleteInstallments(sale.id);
    for (const inst of sale.installments) {
      await db.saveInstallment(toDbInstallment(inst));
    }
  }, []);

  const deleteSale = useCallback(async (id: string, returnStock: boolean = true) => {
    // Soft-delete stock movements (reverte o efeito no estoque)
    await db.deleteStockMovementsByReference(id);

    if (returnStock) {
      const items = await db.getSaleItems(id);
      for (const item of items) {
        const newStock = await db.getProductStock(item.productId);
        dispatch({ type: 'UPDATE_PRODUCT_STOCK', payload: { productId: item.productId, stock: newStock } });
      }
    }

    await db.deleteSaleItems(id);
    await db.deleteInstallments(id);
    await db.deleteSale(id);
    dispatch({ type: 'DELETE_SALE', payload: id });
  }, []);

  const updateInstallment = useCallback(async (saleId: string, installment: Installment) => {
    dispatch({ type: 'UPDATE_INSTALLMENT', payload: { saleId, installment } });
    await db.saveInstallment(toDbInstallment(installment));
  }, []);

  // ---- Settings ----
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...state.settings, ...newSettings };
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    await db.saveSetting('app_settings', JSON.stringify(updated));
  }, [state.settings]);

  const value: AppContextType = {
    ...state,
    state,
    addTag,
    updateTag,
    deleteTag,
    addProduct,
    updateProduct,
    deleteProduct,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    updateSale,
    deleteSale,
    updateInstallment,
    addStockMovement,
    updateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}