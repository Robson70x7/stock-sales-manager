export const PERMISSIONS = {
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  SETTINGS_MANAGE: 'settings.manage',
  LOGS_VIEW: 'logs.view',
  SETTINGS_RESTORE: 'settings.restore',

  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_CANCEL: 'sales.cancel',
  SALES_REFUND: 'sales.refund',
  SALES_EXPORT: 'sales.export',

  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_INVENTORY: 'products.inventory',

  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_EDIT: 'financial.edit',
  FINANCIAL_PAY: 'financial.pay',
  FINANCIAL_CANCEL: 'financial.cancel',
  FINANCIAL_EXPORT: 'financial.export',

  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_DELETE: 'clients.delete',

  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_DELETE: 'suppliers.delete',

  PURCHASES_VIEW: 'purchases.view',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_EDIT: 'purchases.edit',
  PURCHASES_CANCEL: 'purchases.cancel',

  TAGS_VIEW: 'tags.view',
  TAGS_EDIT: 'tags.edit',
  TAGS_DELETE: 'tags.delete',

  REPORTS_VIEW: 'reports.view',
  DASHBOARD_VIEW: 'dashboard.view',

  STOCK_LOSSES_VIEW: 'stock_losses.view',
  STOCK_LOSSES_CREATE: 'stock_losses.create',
  STOCK_LOSSES_EDIT: 'stock_losses.edit',
  STOCK_LOSSES_DELETE: 'stock_losses.delete',

  RETURNS_VIEW: 'returns.view',
  RETURNS_CREATE: 'returns.create',
  RETURNS_APPROVE: 'returns.approve',
  RETURNS_COMPLETE: 'returns.complete',
  RETURNS_CANCEL: 'returns.cancel',
  RETURNS_RECEIVE: 'returns.receive',
  RETURNS_REFUND_DECISION: 'returns.refund_decision',

  DATA_IMPORT: 'data.import',
  DATA_EXPORT: 'data.export',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
