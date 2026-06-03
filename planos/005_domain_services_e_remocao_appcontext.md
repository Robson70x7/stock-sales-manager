# Plano: Migração para Domain Services + Remoção do AppContext

## Arquitetura atual
```
AppContext (616 linhas)
├── Estado global: tags, products, clients, sales, settings
├── Reducer: 18 action types
├── Métodos: 14 mutation callbacks (dispatch → db → invalidate)
└── Usado por 14 arquivos consumidores
```

## Arquitetura alvo
```
React Query cache        ←  todas as leituras via useQuery
     ↕
Domain Services          ←  toda lógica de negócio + persistência
     ↕
SQLite (db.ts)           ←  banco de dados raw
```

AppContext desaparece — sem estado global, sem reducer, sem dispatch.

---

## Fase 1: SaleService (`services/sale-service.ts`)

Classe com toda a lógica de negócio de vendas, extraída do AppContext:

| Método | Origem | Observações |
|---|---|---|
| `getById(id)` | novo (substitui `getSaleById` + items/inst fetch) | Retorna `Sale` completo |
| `getByMonth(year, month)` | já existe em `db.getSalesByMonth` | Wrapper |
| `create(data)` | de `AppContext.addSale` | Calcula custos, persiste sale+items+installments+stock movements |
| `update(sale)` | de `AppContext.updateSale` | Persiste sale+items+installments |
| `cancel(id)` | **novo** | Carrega sale, reverte estoque via `deleteStockMovementsByReference`, status → `'cancelled'` |
| `updateInstallment(saleId, inst)` | de `AppContext.updateInstallment` | Salva installment individual |

SaleService é stateless — métodos estáticos ou singleton. Métodos são async, usam `db.*` diretamente.

## Fase 2: Mutation Hooks

| Hook | Método do Service | Invalida |
|---|---|---|
| `useCreateSale` | `saleService.create(data)` | `['sales']` |
| `useEditSale` | `saleService.update(sale)` | `['sales']`, `['sale', id]` |
| `useCancelSale` | `saleService.cancel(id)` | `['sales']`, `['sale', id]` |
| `useUpdateInstallment` | `saleService.updateInstallment(saleId, inst)` | `['sales']`, `['sale', saleId]` |

Todos os hooks retornam `{ mutateAsync, isPending }` do `useMutation`.

## Fase 3: Query Hooks

| Hook | Método do Service | Usado em |
|---|---|---|
| `useSale(id)` | `saleService.getById(id)` | `sales/[id].tsx`, `sales/edit/[id].tsx` |
| `useSalesByMonth(y,m)` | `saleService.getByMonth(y,m)` | já existe, atualizar |
| `useProducts` | `db.getProducts()` | `products.tsx`, `sales/new.tsx`, `products/[id].tsx` |
| `useTags` | `db.getTags()` | **12 arquivos** (maior dependência) |
| `useClients` | `db.getClients()` | `clients.tsx`, `sales/new.tsx`, etc |
| `useSettings` | `db.getAllSettings()` | `settings.tsx`, `sales/[id].tsx` |

## Fase 4: Atualizar cada arquivo consumidor

| Arquivo | Usa do AppContext atualmente | Nova abordagem |
|---|---|---|
| `(tabs)/index.tsx` | `state.sales`, `state.tags` | `useSalesByMonth` + `useTags` |
| `(tabs)/sales.tsx` | `state.tags` (já usa RQ para sales) | `useTags` |
| `(tabs)/products.tsx` | `state.products` | `useProducts` |
| `(tabs)/clients.tsx` | `state.clients`, `state.sales` | `useClients` + `useSalesByMonth` |
| `(tabs)/tags.tsx` | `state.tags` | `useTags` |
| `(tabs)/reports.tsx` | `state.sales`, `state.clients`, `state.tags` | `useSalesByMonth` + `useClients` + `useTags` |
| `(tabs)/settings.tsx` | `state.settings`, `updateSettings`, `loadAllData` | `useSettings` + mutation hook |
| `sales/new.tsx` | `state.clients`, `state.products`, `state.tags`, `addSale`, `addClient` | `useClients` + `useProducts` + `useTags` + `useCreateSale` |
| `sales/[id].tsx` | `state.sales`, `state.tags`, `deleteSale`, `updateInstallment` | `useSale(id)` + `useTags` + `useCancelSale` + `useUpdateInstallment` |
| `sales/edit/[id].tsx` | `state.sales`, `state.clients`, `state.tags`, `updateSale` | `useSale(id)` + `useClients` + `useTags` + `useEditSale` |
| `clients/[id].tsx` | `state.clients`, `state.sales`, `state.tags` | `useClient(id)` + `useSalesByMonth` + `useTags` |
| `products/[id].tsx` | `state.products`, `state.tags` | `useProduct(id)` + `useTags` |

## Fase 5: Remover AppContext

Após todos os arquivos atualizados:
1. Deletar `context/AppContext.tsx`
2. Remover `AppProvider` de `_layout.tsx`
3. Remover imports não utilizados

## Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Padrão do service | Classe com métodos estáticos/singleton | Familiar, fácil de testar, sem acoplamento com framework |
| Tratamento de erros | Try/catch no service, `onError` no mutation hook | Services lançam, hooks exibem erros via RQ |
| Transformações de dados | Mover `fromDbSale`, `toDbSale` etc. para o service | db.ts mantém-se SQL puro, transforms vivem no domain service |
| Reversão de estoque | `cancel()` do service chama `db.deleteStockMovementsByReference` | Já implementado, apenas mover a chamada |
| Tags | Hook `useTags` com `staleTime: Infinity` | Tags raramente mudam, sem necessidade de refetch |
| Settings | Query + mutation hook simples | Lógica mínima, `db.getAllSettings` / `db.saveSetting` |

## Arquivos a criar (6)

- `services/sale-service.ts`
- `hooks/useSale.ts`
- `hooks/useEditSale.ts`
- `hooks/useCancelSale.ts`
- `hooks/useCreateSale.ts`
- `hooks/useUpdateInstallment.ts`

## Arquivos a modificar (15+)

- `lib/database/db.ts` — adicionar `getFullSaleById`, `updateSaleStatus`
- `hooks/useSalesByMonth.ts` — atualizar para usar SaleService
- `app/(tabs)/index.tsx` — substituir state.sales/tags por hooks
- `app/(tabs)/sales.tsx` — substituir `useApp` tags por `useTags`
- `app/(tabs)/products.tsx` — usar `useProducts`
- `app/(tabs)/clients.tsx` — usar `useClients` + `useSalesByMonth`
- `app/(tabs)/tags.tsx` — usar `useTags`
- `app/(tabs)/reports.tsx` — usar hooks
- `app/(tabs)/settings.tsx` — usar hooks
- `sales/new.tsx` — usar hooks para dados + create mutation
- `sales/[id].tsx` — usar hooks
- `sales/edit/[id].tsx` — usar hooks
- `clients/[id].tsx` — usar hooks
- `products/[id].tsx` — usar hooks
- `app/_layout.tsx` — remover AppProvider

## Ordem de implementação

1. **SaleService** + `db.getFullSaleById` + `db.updateSaleStatus`
2. **Mutation hooks** para sales (edit, cancel, create, updateInstallment)
3. **Query hooks** para dados de suporte (tags, products, clients, settings)
4. **Atualizar telas de vendas** (sales list, detail, edit, new) — prioridade
5. **Atualizar telas restantes** (home, products, clients, tags, reports, settings)
6. **Remover AppContext**
