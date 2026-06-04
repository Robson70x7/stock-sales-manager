-- ============================================================
-- Migration: Auth tables (users, roles, permissions, sessions)
-- Version: 012
-- Date: 2026-06-03
-- Purpose: Add tables for local authentication with users, roles,
--          and permissions synced from desktop
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    roleId TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    mustChangePassword INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    lastLoginAt TEXT,
    recoveryCodeHash TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    isSystem INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    roleId TEXT NOT NULL,
    permissionId TEXT NOT NULL,
    PRIMARY KEY (roleId, permissionId),
    FOREIGN KEY (roleId) REFERENCES roles(id),
    FOREIGN KEY (permissionId) REFERENCES permissions(id)
);

CREATE TABLE IF NOT EXISTS active_session (
    userId TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    startedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- ============================================================
-- Seed all known permissions (static, matches desktop)
-- ============================================================
INSERT OR IGNORE INTO permissions (id, key, module, action, description) VALUES
-- Sistema
('perm_system_users_manage',   'users.manage',     'sistema',  'manage', 'Gerenciar usuários'),
('perm_system_roles_manage',   'roles.manage',     'sistema',  'manage', 'Gerenciar papéis'),
('perm_system_settings_manage','settings.manage',   'sistema',  'manage', 'Gerenciar configurações'),
('perm_system_logs_view',      'logs.view',        'sistema',  'view',   'Visualizar logs'),
('perm_system_settings_restore','settings.restore', 'sistema',  'restore','Restaurar configurações'),
-- Vendas
('perm_sales_view',   'sales.view',   'vendas', 'view',   'Visualizar vendas'),
('perm_sales_create', 'sales.create', 'vendas', 'create', 'Criar vendas'),
('perm_sales_edit',   'sales.edit',   'vendas', 'edit',   'Editar vendas'),
('perm_sales_cancel', 'sales.cancel', 'vendas', 'cancel', 'Cancelar vendas'),
('perm_sales_refund', 'sales.refund', 'vendas', 'refund', 'Reembolsar vendas'),
('perm_sales_export', 'sales.export', 'vendas', 'export', 'Exportar vendas'),
-- Produtos
('perm_products_view',     'products.view',     'produtos', 'view',     'Visualizar produtos'),
('perm_products_create',   'products.create',   'produtos', 'create',   'Criar produtos'),
('perm_products_edit',     'products.edit',     'produtos', 'edit',     'Editar produtos'),
('perm_products_delete',   'products.delete',   'produtos', 'delete',   'Excluir produtos'),
('perm_products_inventory','products.inventory','produtos', 'inventory','Gerenciar estoque'),
-- Financeiro
('perm_financial_view',   'financial.view',   'financeiro', 'view',   'Visualizar financeiro'),
('perm_financial_edit',   'financial.edit',   'financeiro', 'edit',   'Editar financeiro'),
('perm_financial_pay',    'financial.pay',    'financeiro', 'pay',    'Pagar'),
('perm_financial_cancel', 'financial.cancel', 'financeiro', 'cancel', 'Cancelar'),
('perm_financial_export', 'financial.export', 'financeiro', 'export', 'Exportar'),
-- Clientes
('perm_clients_view',   'clients.view',   'clientes',    'view',   'Visualizar clientes'),
('perm_clients_create', 'clients.create', 'clientes',    'create', 'Criar clientes'),
('perm_clients_delete', 'clients.delete', 'clientes',    'delete', 'Excluir clientes'),
-- Fornecedores
('perm_suppliers_view',   'suppliers.view',   'fornecedores', 'view',    'Visualizar fornecedores'),
('perm_suppliers_create', 'suppliers.create', 'fornecedores', 'create',  'Criar fornecedores'),
('perm_suppliers_delete', 'suppliers.delete', 'fornecedores', 'delete',  'Excluir fornecedores'),
-- Compras
('perm_purchases_view',   'purchases.view',   'compras', 'view',    'Visualizar compras'),
('perm_purchases_create', 'purchases.create', 'compras', 'create',  'Criar compras'),
('perm_purchases_edit',   'purchases.edit',   'compras', 'edit',    'Editar compras'),
('perm_purchases_cancel', 'purchases.cancel', 'compras', 'cancel',  'Cancelar compras'),
-- Tags
('perm_tags_view',   'tags.view',   'tags', 'view',   'Visualizar tags'),
('perm_tags_edit',   'tags.edit',   'tags', 'edit',   'Editar tags'),
('perm_tags_delete', 'tags.delete', 'tags', 'delete', 'Excluir tags'),
-- Relatórios
('perm_reports_view',  'reports.view',   'relatorios', 'view', 'Visualizar relatórios'),
-- Dashboard
('perm_dashboard_view','dashboard.view', 'dashboard', 'view', 'Visualizar dashboard'),
-- Perdas de Estoque
('perm_stock_losses_view',   'stock_losses.view',   'perdas', 'view',   'Visualizar perdas'),
('perm_stock_losses_create', 'stock_losses.create', 'perdas', 'create', 'Registrar perdas'),
('perm_stock_losses_edit',   'stock_losses.edit',   'perdas', 'edit',   'Editar perdas'),
('perm_stock_losses_delete', 'stock_losses.delete', 'perdas', 'delete', 'Excluir perdas'),
-- Devoluções
('perm_returns_view',           'returns.view',            'devolucoes', 'view',           'Visualizar devoluções'),
('perm_returns_create',         'returns.create',          'devolucoes', 'create',         'Criar devoluções'),
('perm_returns_approve',        'returns.approve',         'devolucoes', 'approve',        'Aprovar devoluções'),
('perm_returns_complete',       'returns.complete',        'devolucoes', 'complete',       'Concluir devoluções'),
('perm_returns_cancel',         'returns.cancel',          'devolucoes', 'cancel',         'Cancelar devoluções'),
('perm_returns_receive',        'returns.receive',         'devolucoes', 'receive',        'Receber devoluções'),
('perm_returns_refund_decision','returns.refund_decision', 'devolucoes', 'refund_decision','Decidir reembolso'),
-- Importação/Exportação
('perm_data_import', 'data.import', 'dados', 'import', 'Importar dados'),
('perm_data_export', 'data.export', 'dados', 'export', 'Exportar dados');
