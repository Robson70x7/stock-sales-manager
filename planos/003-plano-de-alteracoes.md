# Plano de Alterações — VendaFácil

## Fase 1 — Migration SQL

**Arquivo:** `lib/database/migrations/004_stock_movements.sql`

| Item | Descrição |
|------|-----------|
| 1a | Criar tabela `stock_movements` (`id`, `productId` FK, `quantity` INT, `type` TEXT CHECK(`'in'`,`'out'`,`'initial'`,`'adjustment'`), `referenceId` TEXT, `notes` TEXT, `createdAt` TEXT) + índices |
| 1b | Migrar estoque atual: `INSERT ... SELECT id, stock, 'initial'` de cada produto |
| 1c | Adicionar coluna `isDeleted INTEGER DEFAULT 0` via `ALTER TABLE` em: `products`, `clients`, `sales`, `tags`, `sale_items`, `installments`, `stock_movements` |
| 1d | Adicionar `entryAmount REAL DEFAULT 0` na tabela `sales` |
| 1e | Regenerar `schema.ts` via `pnpm migrations:generate` |

## Fase 2 — Tipos

**Arquivo:** `shared/types/index.ts`

| Item | Descrição |
|------|-----------|
| 2a | Adicionar `StockMovementType = 'in' \| 'out' \| 'initial' \| 'adjustment'` |
| 2b | Adicionar `StockMovement { id, productId, quantity, type, referenceId?, notes?, createdAt }` |
| 2c | Adicionar `entryAmount?: number` em `Sale` |
| 2d | Opcional: `isEntry?: boolean` em `Installment` |

## Fase 3 — Camada de Dados

**Arquivo:** `lib/database/db.ts`

| Item | Descrição |
|------|-----------|
| 3a | Adicionar `DbStockMovement` interface e funções: `getStockMovementsByProduct(productId)`, `saveStockMovement(movement)`, `deleteStockMovementsByReference(referenceId)` |
| 3b | Remover função `updateProductStock(id, quantity)` |
| 3c | **Soft delete**: todas as `SELECT *` ganham `WHERE isDeleted = 0`; `DELETE` vira `UPDATE ... SET isDeleted = 1, updatedAt = ?` |
| 3d | Em `saveProduct`, ignorar campo `stock` no UPDATE (não mais gerenciado manualmente) |
| 3e | Adicionar `getProductStock(productId)` — computa via `SUM(CASE WHEN type IN ('in','initial') THEN quantity ELSE 0 END) - SUM(CASE WHEN type='out' THEN quantity ELSE 0 END)` |
| 3f | Em `saveSale`, incluir `entryAmount` no SQL |

## Fase 4 — Contexto / Lógica

**Arquivo:** `context/AppContext.tsx`

| Item | Descrição |
|------|-----------|
| 4a | Criar `addStockMovement(movement)` |
| 4b | **`addSale`**: após salvar itens, para cada item criar `stock_movement` type=`'out'`, `quantity=item.quantity`, `referenceId=sale.id`; decrementar `product.stock` |
| 4c | **`deleteSale`**: substituir `updateProductStock(item.productId, item.quantity)` por `deleteStockMovementsByReference(sale.id)` (ou reverter com movements type=`'in'`) |
| 4d | **`saveProduct`**: não enviar mais `stock` no UPDATE |
| 4e | Ao carregar dados (`loadAllData`), computar estoque via `getProductStock()` ou manter `product.stock` como cache |

## Fase 5 — UI: Produtos

| Arquivo | Mudanças |
|---------|----------|
| `app/products/new.tsx` | Remover campo "Estoque" (linhas 139-141). Manter "Unidade". |
| `app/products/edit/[id].tsx` | Remover campo "Estoque" (linhas 143-145). |
| `app/products/[id].tsx` | Adicionar botão "Entrada manual" que cria `stock_movement` type=`'in'` via modal. Manter exibição do estoque. |
| `app/(tabs)/products.tsx` | `handleQuickStockAdjust` agora cria `stock_movement` em vez de `updateProduct` direto. |

## Fase 6 — UI: Vendas + Entrada

| Arquivo | Mudanças |
|---------|----------|
| `app/sales/new.tsx` | Adicionar campo "Valor de Entrada" (R\$) na seção de Pagamento. Se `entryAmount > 0`, criar installment `number=1` com amount=entryAmount + gerar N-1 parcelas restantes com `(total - entryAmount) / (N-1)`. Se `entryAmount >= totalAmount`, alertar e tratar como à vista. Validar que entrada não exceda total. |
| `app/sales/edit/[id].tsx` | Exibir entrada como campo read-only ou editável com reajuste de parcelas. |
| `app/sales/[id].tsx` | Exibir installment de entrada com label "Entrada". |
| `lib/utils.ts` | Nova função `generateInstallmentsWithEntry(total, entryAmount, count, startDate)`. |
| `app/(tabs)/sales.tsx` | Ajustar `SummaryItem` de entrada (exibir como installment com label "Entrada"). |

## Fase 7 — last_sync_timestamp

| Item | Descrição |
|------|-----------|
| 7a | Usar `db.saveSetting('last_sync_timestamp', timestamp)` no sync manager |
| 7b | Ler com `db.getSetting('last_sync_timestamp')` para sincronização incremental |

---

## Ordem de Implementação

```
Fase 1 (SQL) → pnpm migrations:generate → Fase 2 (Types)
→ Fase 3 (db.ts) → Fase 4 (AppContext)
→ Fase 5 (Products UI) → Fase 6 (Sales UI)
→ Fase 7 (Sync timestamp)
```

## Observações

- `product.stock` permanece como cache desnormalizado para performance de leitura.
- `updateProductStock()` será removida; estoque é atualizado via movimentos + cache.
- Código duplicado no `addSale` (itens e parcelas salvos duas vezes — linhas 441-498 e 480-515) deve ser corrigido.
- `saveSetting` usa `INSERT OR REPLACE` — foge da convenção mas existe desde o início.
