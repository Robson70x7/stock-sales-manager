# Plano: SQLite Direto no App (sem servidor, sem AsyncStorage)

## Objetivo
Migrar o app mobile para usar SQLite diretamente (expo-sqlite), sem necessidade de servidor Express/tRPC, sem AsyncStorage para dados principais.

## Diferenças - Campos a REMOVER do schema atual:

| Tabela | Campo | Motivo |
|--------|-------|--------|
| `products` | `sku` | Não existe no desktop |
| `products` | `minStock` | Não existe no desktop |
| `products` | `supplier` | Não existe no desktop |
| `sales` | `discountAmount` | Não existe no desktop |

## Campos a ADICIONAR no schema:

| Tabela | Campo | Motivo |
|--------|-------|--------|
| `installments` | `totalInstallments` | Existe no desktop |
| `installments` | `history` | Existe no desktop |

## Passos para Implementar

### 1. Ajustar schema (drizzle/schema.ts)
- Remover: sku, minStock, supplier, discountAmount
- Adicionar: totalInstallments, history no installments

### 2. Instalar expo-sqlite
```bash
pnpm add expo-sqlite
```

### 3. Criar lib/db.ts
Funções CRUD para todas as entidades usando expo-sqlite:
- getTags(), saveTag(), deleteTag()
- getProducts(), saveProduct(), deleteProduct()
- getClients(), saveClient(), deleteClient()
- getSales(), saveSale(), deleteSale()
- getInstallments(), updateInstallment()
- getSetting(), saveSetting()

### 4. Criar lib/db-init.ts
Criar tabelas na primeira inicialização do app

### 5. Atualizar AppContext
Substituir AsyncStorage e trpc por chamadas diretas ao db

### 6. Atualizar shared/types.ts
Ajustar para usar mesma estrutura do desktop

### 7. Remover campos das Telas
- app/products/new.tsx - Remover campo SKU
- app/products/edit/[id].tsx - Remover campos SKU, fornecedor, estoque mínimo
- app/products/[id].tsx - Remover display de campos
- app/sales/new.tsx - Remover campo discountAmount

### 8. Remover código não utilizado
- server/ - Código do servidor
- lib/trpc.ts - tRPC
- hooks/use-auth.ts - Auth (se não usado para outras coisas)

## Arquivos criados/modificados

### Novos
- lib/db.ts - Funções CRUD com expo-sqlite
- lib/db-init.ts - Criar tabelas

### Modificados
- drizzle/schema.ts - Campos iguais ao desktop
- shared/types.ts - Tipos iguais ao desktop
- context/AppContext.tsx - Usar db.* ao invés de AsyncStorage
- package.json - Adicionar expo-sqlite

### Telas atualizadas (remover campos)
- app/products/new.tsx
- app/products/edit/[id].tsx
- app/products/[id].tsx
- app/sales/new.tsx

### Removidos
- server/ (código do servidor)
- lib/trpc.ts (tRPC)
- Código de migração no AppContext

## Fluxo de dados (novo)

```typescript
// App inicia
db.init()           // Cria tabelas se não existirem
db.getProducts()    // Lê do SQLite
→ dispatch({ type: 'LOAD_DATA', products })

// Usuário adiciona produto
db.saveProduct(p)   // Salva no SQLite
→ dispatch({ type: 'ADD_PRODUCT', p })
// Pronto! Sem servidor, sem AsyncStorage
```

## Data: 2026-05-04