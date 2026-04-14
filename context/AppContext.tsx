import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tag, Product, Client, Sale, Installment, AppSettings } from '@/types';

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
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveData: (newState: Partial<Omit<AppState, 'isLoading'>>) => Promise<void>;
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
  deleteSale: (id: string, shouldReturnStock?: boolean) => Promise<void>;
  updateInstallment: (saleId: string, installment: Installment) => Promise<void>;
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  TAGS: '@vendafacil:tags',
  PRODUCTS: '@vendafacil:products',
  CLIENTS: '@vendafacil:clients',
  SALES: '@vendafacil:sales',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar dados do AsyncStorage na inicialização
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [tagsJson, productsJson, clientsJson, salesJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TAGS),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.CLIENTS),
        AsyncStorage.getItem(STORAGE_KEYS.SALES),
      ]);
      const settingsJson = await AsyncStorage.getItem('app_settings');
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          tags: tagsJson ? JSON.parse(tagsJson) : [],
          products: productsJson ? JSON.parse(productsJson) : [],
          clients: clientsJson ? JSON.parse(clientsJson) : [],
          sales: salesJson ? JSON.parse(salesJson) : [],
          settings: settingsJson ? JSON.parse(settingsJson) : { askReturnStockOnDelete: true },
        },
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveData = useCallback(async (newState: Partial<Omit<AppState, 'isLoading'>>) => {
    const saves: Promise<void>[] = [];
    if (newState.tags !== undefined) saves.push(AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newState.tags)));
    if (newState.products !== undefined) saves.push(AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newState.products)));
    if (newState.clients !== undefined) saves.push(AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newState.clients)));
    if (newState.sales !== undefined) saves.push(AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newState.sales)));
    await Promise.all(saves);
  }, []);

  // ---- Tags ----
  const addTag = useCallback(async (tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> => {
    const tag: Tag = { ...tagData, id: generateId(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_TAG', payload: tag });
    const newTags = [...state.tags, tag];
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newTags));
    return tag;
  }, [state.tags]);

  const updateTag = useCallback(async (tag: Tag) => {
    dispatch({ type: 'UPDATE_TAG', payload: tag });
    const newTags = state.tags.map(t => t.id === tag.id ? tag : t);
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newTags));
  }, [state.tags]);

  const deleteTag = useCallback(async (id: string) => {
    // Remove a tag e limpa referências em produtos, clientes e vendas
    dispatch({ type: 'DELETE_TAG', payload: id });
    const newTags = state.tags.filter(t => t.id !== id);
    const newProducts = state.products.map(p => p.tagIds.includes(id) ? { ...p, tagIds: p.tagIds.filter(t => t !== id) } : p);
    const newClients = state.clients.map(c => c.tagIds.includes(id) ? { ...c, tagIds: c.tagIds.filter(t => t !== id) } : c);
    const newSales = state.sales.map(s => s.tagIds.includes(id) ? { ...s, tagIds: s.tagIds.filter(t => t !== id) } : s);
    dispatch({ type: 'LOAD_DATA', payload: { tags: newTags, products: newProducts, clients: newClients, sales: newSales, settings: state.settings } });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(newTags)),
      AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts)),
      AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients)),
      AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales)),
    ]);
  }, [state.tags, state.products, state.clients, state.sales]);

  // ---- Products ----
  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const now = new Date().toISOString();
    const product: Product = { ...productData, id: generateId(), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_PRODUCT', payload: product });
    const newProducts = [...state.products, product];
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    return product;
  }, [state.products]);

  const updateProduct = useCallback(async (product: Product) => {
    const updated = { ...product, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
    const newProducts = state.products.map(p => p.id === product.id ? updated : p);
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
  }, [state.products]);

  const deleteProduct = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
    const newProducts = state.products.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
  }, [state.products]);

  // ---- Clients ----
  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const now = new Date().toISOString();
    const client: Client = { ...clientData, id: generateId(), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_CLIENT', payload: client });
    const newClients = [...state.clients, client];
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
    return client;
  }, [state.clients]);

  const updateClient = useCallback(async (client: Client) => {
    const updated = { ...client, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_CLIENT', payload: updated });
    const newClients = state.clients.map(c => c.id === client.id ? updated : c);
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
  }, [state.clients]);

  const deleteClient = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
    const newClients = state.clients.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
  }, [state.clients]);

  // ---- Sales ----
  const addSale = useCallback(async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
    const now = new Date().toISOString();
    const sale: Sale = { ...saleData, id: generateId(), createdAt: now, updatedAt: now };
    
    // Debito automatico de estoque
    const updatedProducts = state.products.map(product => {
      const saleItem = sale.items.find(item => item.productId === product.id);
      if (saleItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - saleItem.quantity),
          updatedAt: now,
        };
      }
      return product;
    });
    
    dispatch({ type: 'ADD_SALE', payload: sale });
    const newSales = [...state.sales, sale];
    await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
    
    // Salvar produtos com estoque atualizado
    updatedProducts.forEach(p => {
      if (state.products.find(sp => sp.id === p.id)?.stock !== p.stock) {
        dispatch({ type: 'UPDATE_PRODUCT', payload: p });
      }
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    
    return sale;
  }, [state.sales, state.products]);

  const updateSale = useCallback(async (sale: Sale) => {
    const updated = { ...sale, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_SALE', payload: updated });
    const newSales = state.sales.map(s => s.id === sale.id ? updated : s);
    await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
  }, [state.sales]);

  const deleteSale = useCallback(async (id: string, shouldReturnStock: boolean = true) => {
    const saleToDelete = state.sales.find(s => s.id === id);
    if (!saleToDelete) return;
    
    dispatch({ type: 'DELETE_SALE', payload: id });
    const newSales = state.sales.filter(s => s.id !== id);
    
    // Devolver estoque se configurado
    let updatedProducts = state.products;
    if (shouldReturnStock) {
      updatedProducts = state.products.map(product => {
        const saleItem = saleToDelete.items.find(item => item.productId === product.id);
        if (saleItem) {
          return {
            ...product,
            stock: product.stock + saleItem.quantity,
            updatedAt: new Date().toISOString(),
          };
        }
        return product;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      updatedProducts.forEach(p => {
        if (state.products.find(sp => sp.id === p.id)?.stock !== p.stock) {
          dispatch({ type: 'UPDATE_PRODUCT', payload: p });
        }
      });
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
  }, [state.sales, state.products]);

  const updateInstallment = useCallback(async (saleId: string, installment: Installment) => {
    dispatch({ type: 'UPDATE_INSTALLMENT', payload: { saleId, installment } });
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;
    const updatedInstallments = sale.installments.map(i => i.id === installment.id ? installment : i);
    const allPaid = updatedInstallments.every(i => i.status === 'paid');
    const somePaid = updatedInstallments.some(i => i.status === 'paid');
    const newStatus = allPaid ? 'paid' : somePaid ? 'partial' : 'pending';
    const updatedSale = { ...sale, installments: updatedInstallments, status: newStatus as any, updatedAt: new Date().toISOString() };
    const newSales = state.sales.map(s => s.id === saleId ? updatedSale : s);
    await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
  }, [state.sales]);

  const updateSettings = useCallback(async (settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    const newSettings = { ...state.settings, ...settings };
    await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
  }, [state.settings]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      saveData,
      addTag, updateTag, deleteTag,
      addProduct, updateProduct, deleteProduct,
      addClient, updateClient, deleteClient,
      addSale, updateSale, deleteSale, updateInstallment,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
