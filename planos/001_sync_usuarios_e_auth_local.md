# Plano: Sync de Usuários do Desktop + Auth Local no Mobile

## Objetivo
Substituir o sistema de autenticação OAuth no mobile por um sistema de login local com usuários e permissões sincronizados do VendaFácil Desktop, permitindo que o app funcione sem depender de servidor externo.

## Decisões Tomadas

| Decisão | Escolha |
|---|---|
| Armazenamento de senha | **Opção A** — Sincronizar hash bcrypt do desktop para o mobile (futuramente: login via WebSocket com o desktop como auth server) |
| Tela de `mustChangePassword` | **Não implementar** agora |
| Usuários inativos (`isActive = 0`) | **Não podem logar** no mobile |
| Modelo de permissões | **String-based** — copiar modelo do desktop: `"module.action"`, admin recebe `["*"]` |
| Fluxo de primeiro uso | **Sync → Login → App** |

---

## Estrutura de Diretórios (novos/alterados)

```
src/
  shared/
    auth/
      permissions.ts          ← NOVO: constantes de permissão (cópia do desktop)
    sync/
      types.ts                ← ALTERADO: novos entities
      db.ts                   ← ALTERADO: mergeUsers, mergeRoles, mergePermissions, mergeRolePermissions
      sync-manager.ts         ← ALTERADO: pull de users/roles/permissions
    hooks/
      use-permissions.ts      ← NOVO: hook de verificação de permissões
      use-auth.ts             ← ALTERADO: substituir OAuth por auth local
    lib/
      auth-service.ts         ← NOVO: serviço de login/verificação local
  infra/database/
    schema.ts                 ← ALTERADO: nova migration v12
    migrations/
      012_auth_tables.sql     ← NOVO: migration com tabelas de auth
  presentation/app/
    (auth)/
      _layout.tsx             ← NOVO: layout do grupo auth
      sync-initial.tsx        ← NOVO: tela de primeira sincronização
      login.tsx               ← NOVO: tela de login
    _layout.tsx               ← ALTERADO: adicionar rotas (auth), lógica de redirect
    oauth/
      callback.tsx            ← ALTERADO: desabilitar/redirecionar
  shared/_core/
    auth.ts                   ← ALTERADO: remover OAuth, manter só tipos
```

---

## Fase 1 — Banco de Dados Local

### Migration 012 — `012_auth_tables.sql`

```sql
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
```

### Tarefas
- [ ] Adicionar migration 012 no `schema.ts`
- [ ] Atualizar `db_version` para 12

---

## Fase 2 — Estender Protocolo de Sync

### Alterações em `src/shared/sync/types.ts`

```typescript
// No union type DesktopSyncMessageType:
type DesktopSyncMessageType = 
  | 'handshake' | 'handshake_ack' 
  | 'pull' | 'pull_result' 
  | 'sale' | 'ack' | 'error';

// No union type de entity (no pull/pull_result):
entity?: 'products' | 'clients' | 'tags' | 'suppliers' 
       | 'users' | 'roles';
```

### Tarefas
- [ ] Adicionar `'users'` e `'roles'` ao tipo `entity`
- [ ] Garantir que o tipo `SyncMessage` comporte essas entidades

---

## Fase 3 — Merge Functions

### `src/shared/sync/db.ts` — Novas funções

```typescript
export async function mergeUsers(users: UserData[]): Promise<void> {
    const database = await getDb();
    for (const user of users) {
        // UPSERT: verificar existência, atualizar ou inserir
        // Inclui todos os campos: id, name, username, passwordHash, roleId,
        // isActive, mustChangePassword, createdAt, updatedAt, lastLoginAt, recoveryCodeHash
    }
}

export async function mergeRoles(roles: RoleData[]): Promise<void> {
    const database = await getDb();
    for (const role of roles) {
        // UPSERT em roles
        
        // Processar permissions aninhadas:
        // role.permissions é string[] (ex: ["sales.view", "products.create"])
        // Buscar cada permission key na tabela permissions (pré-seedada na migration)
        // e criar associação em role_permissions
    }
}
```

> **Nota:** `permissions` e `role_permissions` **não** são sincronizados como entidades separadas. A tabela `permissions` é pré-seedada na migration v12 com todas as permissões conhecidas. O `mergeRoles()` recebe `permissions: string[]` aninhado dentro de cada role.

### `src/shared/sync/sync-manager.ts` — Estender `syncAll()`

```typescript
async syncAll(): Promise<void> {
    this.setStatus('syncing');
    try {
        // Novos pulls — roles primeiro (contém permissions aninhado), depois users
        await this.pullCatalog('roles');
        await this.pullCatalog('users');
        
        // Pulls existentes
        await this.pullCatalog('products');
        await this.pullCatalog('clients');
        await this.pullCatalog('tags');
        await this.pullCatalog('suppliers');
        
        // Push de vendas
        await this.sendPendingSales();
        
        this.setStatus('idle');
    } catch (error) {
        this.setStatus('error', error);
        throw error;
    }
}
```

### Tarefas
- [ ] Implementar `mergeUsers()`
- [ ] Implementar `mergeRoles()`
- [ ] Implementar `mergePermissions()`
- [ ] Implementar `mergeRolePermissions()`
- [ ] Estender `SyncManager.syncAll()`
- [ ] Estender `pullCatalog()` para tratar as novas entidades

---

## Fase 4 — Auth Service Local

### `src/shared/lib/auth-service.ts`

```typescript
import bcrypt from 'bcryptjs';
import { getDb } from '@/infra/database/db';

export interface AuthenticatedUser {
    id: string;
    name: string;
    username: string;
    roleId: string;
    roleName: string;
    permissions: string[];
    mustChangePassword: boolean;
}

export class AuthService {
    static login(username: string, password: string): AuthenticatedUser | null {
        const db = getDb();
        const user = db.prepare(
            'SELECT * FROM users WHERE username = ? AND isActive = 1'
        ).get(username);
        
        if (!user) return null;
        
        const valid = bcrypt.compareSync(password, user.passwordHash);
        if (!valid) return null;
        
        // Obter role
        const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(user.roleId);
        
        // Obter permissions
        let permissions: string[];
        if (role?.name === 'ADMIN') {
            permissions = ['*'];
        } else {
            const rows = db.prepare(`
                SELECT p.key FROM permissions p
                JOIN role_permissions rp ON rp.permissionId = p.id
                WHERE rp.roleId = ?
            `).all(user.roleId);
            permissions = rows.map(r => r.key);
        }
        
        // Criar sessão (substitui qualquer sessão anterior)
        const token = crypto.randomUUID();
        db.prepare('DELETE FROM active_session').run();
        db.prepare(
            'INSERT INTO active_session (userId, token, startedAt) VALUES (?, ?, ?)'
        ).run(user.id, token, new Date().toISOString());
        
        // Atualizar lastLoginAt
        db.prepare('UPDATE users SET lastLoginAt = ? WHERE id = ?')
            .run(new Date().toISOString(), user.id);
        
        return { id, name, username, roleId, roleName, permissions, mustChangePassword };
    }
    
    static getSession(): AuthenticatedUser | null {
        const db = getDb();
        const session = db.prepare(`
            SELECT u.*, r.name as roleName 
            FROM active_session s
            JOIN users u ON u.id = s.userId
            JOIN roles r ON r.id = u.roleId
            WHERE u.isActive = 1
        `).get();
        
        if (!session) return null;
        
        // Reconstruir permissions (mesma lógica do login)
        // ...
        
        return authenticatedUser;
    }
    
    static logout(): void {
        const db = getDb();
        db.prepare('DELETE FROM active_session').run();
    }
    
    static hasUsers(): boolean {
        const db = getDb();
        const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
        return result.count > 0;
    }
}
```

### Dependência
- [ ] `pnpm add bcryptjs`
- [ ] `pnpm add -D @types/bcryptjs`

### Tarefas
- [ ] Criar `AuthService` com `login()`, `getSession()`, `logout()`, `hasUsers()`
- [ ] Testar se `bcryptjs` funciona no React Native / Expo (pode precisar de polyfill)

---

## Fase 5 — Constantes de Permissão

### `src/shared/auth/permissions.ts`

```typescript
export const PERMISSIONS = {
    // Sistema
    USERS_MANAGE: 'users.manage',
    ROLES_MANAGE: 'roles.manage',
    SETTINGS_MANAGE: 'settings.manage',
    LOGS_VIEW: 'logs.view',
    SETTINGS_RESTORE: 'settings.restore',
    
    // Vendas
    SALES_VIEW: 'sales.view',
    SALES_CREATE: 'sales.create',
    SALES_EDIT: 'sales.edit',
    SALES_CANCEL: 'sales.cancel',
    SALES_REFUND: 'sales.refund',
    SALES_EXPORT: 'sales.export',
    
    // Produtos
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_CREATE: 'products.create',
    PRODUCTS_EDIT: 'products.edit',
    PRODUCTS_DELETE: 'products.delete',
    PRODUCTS_INVENTORY: 'products.inventory',
    
    // Financeiro
    FINANCIAL_VIEW: 'financial.view',
    FINANCIAL_EDIT: 'financial.edit',
    FINANCIAL_PAY: 'financial.pay',
    FINANCIAL_CANCEL: 'financial.cancel',
    FINANCIAL_EXPORT: 'financial.export',
    
    // Clientes
    CLIENTS_VIEW: 'clients.view',
    CLIENTS_CREATE: 'clients.create',
    CLIENTS_DELETE: 'clients.delete',
    
    // Fornecedores
    SUPPLIERS_VIEW: 'suppliers.view',
    SUPPLIERS_CREATE: 'suppliers.create',
    SUPPLIERS_DELETE: 'suppliers.delete',
    
    // Compras
    PURCHASES_VIEW: 'purchases.view',
    PURCHASES_CREATE: 'purchases.create',
    PURCHASES_EDIT: 'purchases.edit',
    PURCHASES_CANCEL: 'purchases.cancel',
    
    // Tags
    TAGS_VIEW: 'tags.view',
    TAGS_EDIT: 'tags.edit',
    TAGS_DELETE: 'tags.delete',
    
    // Relatórios
    REPORTS_VIEW: 'reports.view',
    
    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',
    
    // Perdas de Estoque
    STOCK_LOSSES_VIEW: 'stock_losses.view',
    STOCK_LOSSES_CREATE: 'stock_losses.create',
    STOCK_LOSSES_EDIT: 'stock_losses.edit',
    STOCK_LOSSES_DELETE: 'stock_losses.delete',
    
    // Devoluções
    RETURNS_VIEW: 'returns.view',
    RETURNS_CREATE: 'returns.create',
    RETURNS_APPROVE: 'returns.approve',
    RETURNS_COMPLETE: 'returns.complete',
    RETURNS_CANCEL: 'returns.cancel',
    RETURNS_RECEIVE: 'returns.receive',
    RETURNS_REFUND_DECISION: 'returns.refund_decision',
    
    // Importação/Exportação
    DATA_IMPORT: 'data.import',
    DATA_EXPORT: 'data.export',
} as const;
```

### Tarefas
- [ ] Criar `permissions.ts` com todas as constantes do desktop
- [ ] Remover `NOT_ADMIN_ERR_MSG` de `const.ts`

---

## Fase 6 — Hook de Permissões

### `src/shared/hooks/use-permissions.ts`

```typescript
import { useAuth } from './use-auth';

export function usePermissions() {
    const { user } = useAuth();
    
    const can = (permissionKey: string): boolean => {
        if (!user) return false;
        if (user.permissions.includes('*')) return true;
        return user.permissions.includes(permissionKey);
    };
    
    return { can, user };
}
```

### Tarefas
- [ ] Criar hook `usePermissions()`
- [ ] Integrar nas telas: esconder abas/botões conforme permissão

---

## Fase 7 — Substituir `use-auth` (Remover OAuth)

### Alterações em `src/shared/hooks/use-auth.ts`

- Remover dependência de `Auth.getSessionToken()` / `Auth.setSessionToken()` (SecureStore)
- Remover chamadas a `Api.getMe()`, `Api.exchangeOAuthCode()`, `Api.establishSession()`
- Usar `AuthService.login()` e `AuthService.getSession()` e `AuthService.logout()`
- Na inicialização: chamar `AuthService.getSession()` em vez de verificar token

### Alterações em `src/shared/_core/auth.ts`

- Remover `startOAuthLogin()`
- Remover `exchangeOAuthCode()`
- Remover `setSessionToken()`, `getSessionToken()`, `setUserInfo()`, `getUserInfo()`
- Manter apenas a interface `User` se ainda for usada

### Tarefas
- [ ] Refatorar `use-auth.ts` para usar `AuthService`
- [ ] Limpar `auth.ts` — remover funções OAuth
- [ ] Remover `src/presentation/app/oauth/` (ou desabilitar)

---

## Fase 8 — Telas de Autenticação

### `src/presentation/app/(auth)/_layout.tsx`

Layout simples sem tabs, apenas Stack com fundo limpo:

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sync-initial" />
            <Stack.Screen name="login" />
        </Stack>
    );
}
```

### `src/presentation/app/(auth)/sync-initial.tsx`

Tela de primeira sincronização:
- Logo + texto explicativo
- "Conecte-se ao computador com VendaFácil Desktop na mesma rede"
- Botão "Sincronizar Agora"
- Usa `DeviceDiscoveryService` + `LocalP2PSyncAdapter` + `SyncManager`
- Progresso: descobrindo → conectando → sincronizando
- Ao finalizar: navega para `/login`
- Em erro: mensagem + botão "Tentar Novamente"

### `src/presentation/app/(auth)/login.tsx`

Tela de login:
- Campo: username
- Campo: senha (secureTextEntry)
- Botão "Entrar"
- Chama `AuthService.login()`
- Sucesso: navega para `/(tabs)`
- Erro: "Usuário ou senha inválidos"
- Se não houver usuários: redireciona para `sync-initial`

### Tarefas
- [ ] Criar `(auth)/_layout.tsx`
- [ ] Criar `(auth)/sync-initial.tsx`
- [ ] Criar `(auth)/login.tsx`
- [ ] Adicionar rotas no `_layout.tsx` raiz

---

## Fase 9 — Lógica de Redirecionamento Global

### `src/presentation/app/_layout.tsx`

Lógica no carregamento inicial:
```
1. App inicia
2. Verificar active_session via AuthService.getSession()
3. Se sessão ativa → redirecionar para /(tabs)
4. Se não:
   a. Verificar AuthService.hasUsers()
   b. Se não tem usuários → redirecionar para /(auth)/sync-initial
   c. Se tem usuários → redirecionar para /(auth)/login
```

Implementar via `useEffect` + `useRouter` ou um `Redirect` condicional.

### Tarefas
- [ ] Implementar lógica de redirect no layout raiz
- [ ] Garantir que não haja flash de tela indevido

---

## Fase 10 — Modificações no Desktop

> **Nota:** Essas alterações são no repositório `stock-sale-manager-desktop`

### `SyncPullHandler.ts`
- [ ] Adicionar suporte para `entity: 'users'` → retorna lista de usuários (**incluindo `passwordHash`** e todos os campos)
- [ ] Adicionar suporte para `entity: 'roles'` → retorna lista de papéis com **`permissions: string[]` aninhado**

### Repositórios
- [ ] `UserRepository.getAllUpdatedSince(since)` → retorna todas as colunas (`SELECT *`) incluindo `passwordHash`
- [ ] `RoleRepository.getAllUpdatedSince(since)` → retorna role + `permissions: string[]` (buscar via `role_permissions JOIN permissions`)

### Contrato de pull_result para roles:

```json
{
  "type": "pull_result",
  "entity": "roles",
  "data": [
    {
      "id": "uuid-role-1",
      "name": "Vendedor",
      "description": "Acesso a vendas e produtos",
      "isSystem": 0,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "permissions": ["sales.view", "sales.create", "products.view"]
    }
  ],
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

> Sem necessidade de sincronizar `permissions` ou `role_permissions` como entidades separadas — o seed está na migration v12 do mobile.

---

## Ordem de Implementação Sugerida

| Ordem | Fase | Descrição |
|---|---|---|
| 1 | Fase 10 | Desktop: estender SyncPullHandler para `users` e `roles` (com `permissions` aninhado) |
| 2 | Fase 1 | Migration 012 no mobile (inclui seed de permissions) |
| 3 | Fase 2 | Tipos do protocolo |
| 4 | Fase 3 | Merge functions `mergeUsers` + `mergeRoles` + estender SyncManager |
| 5 | Fase 5 | Constantes de permissão |
| 6 | Fase 4 | AuthService + bcryptjs |
| 7 | Fase 8 | Telas sync-initial + login |
| 8 | Fase 7 | Substituir use-auth / remover OAuth |
| 9 | Fase 9 | Lógica de redirect global |
| 10 | Fase 6 | Hook usePermissions + integração nas telas |
