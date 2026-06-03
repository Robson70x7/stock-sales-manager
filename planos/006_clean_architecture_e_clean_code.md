# 006 — Clean Architecture + Clean Code

Refatorar a escrita e estrutura dos serviços e componentes seguindo Clean Architecture e Clean Code.

---

## Diagnóstico Atual

### Problemas encontrados

1. **Camada de serviço inconsistente** — `SaleService` existe, mas Products, Clients, Tags, Settings acessam `db.ts` diretamente dos hooks
2. **Funções de mapeamento duplicadas** — `fromDbProduct`, `fromDbClient`, `fromDbTag` copiadas em 2 hooks cada (useProduct + useProducts, useClient + useClients)
3. **Sem inversão de dependência** — `SaleService` importa `db.ts` e `queryClient` diretamente (acoplamento concreto)
4. **Responsabilidades misturadas** — `db.ts` faz data access + model mapping; hooks fazem data fetching + lógica de domínio
5. **Invalidação de cache espalhada** — `SaleService` invalida queries internamente E hooks também invalidam (dupla invalidação). `useCreateSale` não invalida nada
6. **Sem camada de domínio** — Regras de negócio estão espalhadas (cálculo de custo/lucro no `SaleService.create`, construção de entidades no `useCreateClient` inline)

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---|---|---|
| Injeção de dependência | Constructor Injection manual | Simples, sem libs extras. Hooks usam `useMemo(() => new Service(new Repo()), [])` |
| Localização dos tipos | `shared/domain/entities/` | Migrar interfaces atuais de `shared/types/` para classes/entidades com comportamento |
| Profundidade da refatoração | Completa (Fases 1-7) | Cobrir domain entities, ports, repositories, services, hooks refatorados, db.ts limpeza |

---

## Estrutura Final

```
shared/
  domain/
    entities/
      Sale.ts              → classe com fromDb(), create(), toDb(), toDbItems(), toDbInstallments()
      Product.ts           → classe com fromDb(), create(), toDb(), calculateMargin()
      Client.ts            → classe com fromDb(), create(), toDb()
      Installment.ts       → classe com fromDb(), isOverdue(), toDb()
      Tag.ts               → classe com fromDb(), toDb()
      StockMovement.ts     → classe com fromDb(), toDb()
      Settings.ts          → classe com fromJson(), toJson(), merge()
    value-objects/
      Money.ts             → valor tipado para moeda
  application/
    ports/
      ISaleRepository.ts
      IProductRepository.ts
      IClientRepository.ts
      ITagRepository.ts
      ISettingsRepository.ts
      IStockMovementRepository.ts
    services/
      SaleService.ts       → casos de uso: create, update, cancel, updateInstallment
      ProductService.ts    → casos de uso: list, get, create, update, delete
      ClientService.ts     → casos de uso: list, get, create, update, delete
      TagService.ts        → casos de uso: list, get
      SettingsService.ts   → casos de uso: get, update

lib/
  database/
    repositories/
      SaleRepository.ts
      ProductRepository.ts
      ClientRepository.ts
      TagRepository.ts
      SettingsRepository.ts
      StockMovementRepository.ts
    db.ts                  → mantido (raw SQL, Db* interfaces, funções auxiliares)
    schema.ts              → mantido

hooks/                     → thin React Query wrappers (sem lógica de domínio)
  useSale.ts
  useAllSales.ts
  useCreateSale.ts
  useEditSale.ts
  useCancelSale.ts
  useUpdateInstallment.ts
  useProducts.ts
  useProduct.ts
  useClients.ts
  useClient.ts
  useCreateClient.ts
  useTags.ts
  useSettings.ts
  useStockMovements.ts     → (novo, se necessário)

services/                  → REMOVIDO (migrado para shared/application/services/)
context/AppContext.tsx     → já removido
types/                     → REMOVIDO ou vira barrel re-export
shared/types/              → REMOVIDO (tipos migrados para domain/entities)
```

---

## Regra de Dependência

```
app/*.tsx (screens)
    ↓
hooks/*.ts                 ← React Query, invalidateQueries só aqui
    ↓
shared/application/services/*.ts  ← regras de negócio, sem React/screens
    ↓
lib/database/repositories/*.ts    ← implementações concretas
    ↓
lib/database/db.ts                ← raw SQL, Db* interfaces
    ↑
shared/application/ports/*.ts     ← interfaces (contratos)
    ↑
shared/domain/entities/*.ts       ← entidades puras, factory methods
```

Nenhuma camada interna conhece a camada externa. Hooks NUNCA importam `db.ts` diretamente.

---

## Fases de Execução

### Fase 1 — Domain Entities

Criar classes em `shared/domain/entities/` com:
- Construtor privado (só factory methods criam instâncias)
- Factory `fromDb(dbRow, ...)` — converte `Db*` em entidade
- Factory `create(input)` — constrói nova entidade com validação
- Métodos `toDb*()` — converte entidade de volta para `Db*`
- Métodos de domínio — `isPaid`, `totalProfit`, `calculateMargin`, `isOverdue`

```typescript
// shared/domain/entities/Sale.ts

export class Sale {
  readonly id: string;
  readonly items: SaleItem[];
  readonly installments: Installment[];
  readonly subtotal: number;
  readonly totalAmount: number;
  readonly status: SaleStatus;
  // ... todos os campos (readonly)

  private constructor(props: SaleProps) {
    Object.assign(this, props);
  }

  static fromDb(row: DbSale, items: DbSaleItem[], installments: DbInstallment[]): Sale {
    return new Sale({
      id: row.id,
      items: items.map(SaleItem.fromDb),
      installments: installments.map(Installment.fromDb),
      subtotal: row.subtotal,
      totalAmount: row.totalAmount,
      status: row.status,
      // ...
    });
  }

  static create(input: CreateSaleInput): Sale { ... }

  get totalProfit(): number {
    return this.items.reduce((sum, i) => sum + (i.profitAmount ?? 0), 0);
  }

  cancel(): Sale { /* retorna nova instância com status='cancelled' */ }

  toDbSale(): DbSale { ... }
  toDbItems(): DbSaleItem[] { ... }
  toDbInstallments(): DbInstallment[] { ... }
}
```

**Arquivos:**
- `shared/domain/entities/Sale.ts` (+ extrair `SaleItem`, `CreateSaleInput` internos)
- `shared/domain/entities/Product.ts`
- `shared/domain/entities/Client.ts`
- `shared/domain/entities/Installment.ts`
- `shared/domain/entities/Tag.ts`
- `shared/domain/entities/StockMovement.ts`
- `shared/domain/entities/Settings.ts`
- `shared/domain/entities/index.ts` (barrel)

**Modificar:**
- `@/types` → apontar para `@shared/domain/entities` como re-export (ou remover)

---

### Fase 2 — Repository Ports

Interfaces puras (sem dependências externas). Métodos retornam entidades de domínio.

```typescript
// shared/application/ports/ISaleRepository.ts
export interface ISaleRepository {
  findById(id: string): Promise<Sale | null>;
  findAll(): Promise<Sale[]>;
  findByMonth(year: number, month: number): Promise<Sale[]>;
  save(sale: Sale): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Arquivos:**
- `shared/application/ports/ISaleRepository.ts`
- `shared/application/ports/IProductRepository.ts`
- `shared/application/ports/IClientRepository.ts`
- `shared/application/ports/ITagRepository.ts`
- `shared/application/ports/ISettingsRepository.ts`
- `shared/application/ports/IStockMovementRepository.ts`

---

### Fase 3 — Repositories (Infrastructure)

Concretos em `lib/database/repositories/`. Únicos que importam `db.ts`.

```typescript
// lib/database/repositories/SaleRepository.ts
export class SaleRepository implements ISaleRepository {
  async findById(id: string): Promise<Sale | null> {
    const row = await db.getSaleById(id);
    if (!row) return null;
    const items = await db.getSaleItems(id);
    const installments = await db.getInstallments(id);
    return Sale.fromDb(row, items, installments);
  }

  async save(sale: Sale): Promise<void> {
    await db.saveSale(sale.toDbSale());
    await db.deleteSaleItems(sale.id);
    for (const item of sale.toDbItems()) {
      await db.saveSaleItem(item);
    }
    await db.deleteInstallments(sale.id);
    for (const inst of sale.toDbInstallments()) {
      await db.saveInstallment(inst);
    }
  }
}
```

```typescript
// lib/database/repositories/ProductRepository.ts
export class ProductRepository implements IProductRepository {
  async findAll(): Promise<Product[]> {
    const rows = await db.getProducts();
    return Promise.all(
      rows.map(async (row) => {
        const tagIds = await db.getProductTags(row.id);
        return Product.fromDb(row, tagIds);
      })
    );
  }
}
```

**Nesta fase, remover** `toDbSale`, `toDbSaleItem`, `toDbInstallment`, `fromDbSale` do `db.ts` (migram para `Sale.ts`). Duplicatas de `fromDbProduct`/`fromDbClient`/`fromDbTag` nos hooks são eliminadas.

**Arquivos:**
- `lib/database/repositories/SaleRepository.ts`
- `lib/database/repositories/ProductRepository.ts`
- `lib/database/repositories/ClientRepository.ts`
- `lib/database/repositories/TagRepository.ts`
- `lib/database/repositories/SettingsRepository.ts`
- `lib/database/repositories/StockMovementRepository.ts`

---

### Fase 4 — Application Services

Casos de uso em `shared/application/services/`. Recebem repositórios via construtor. **Sem dependência de React Query ou db.ts**.

```typescript
// shared/application/services/SaleService.ts
export class SaleService {
  constructor(
    private saleRepo: ISaleRepository,
    private productRepo: IProductRepository,
    private stockRepo: IStockMovementRepository,
  ) {}

  async create(input: CreateSaleInput): Promise<Sale> {
    const itemsWithCost = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.productRepo.findById(item.productId);
        const costAtSale = item.quantity * (product?.averageCost ?? 0);
        return { ...item, costAtSale, profitAmount: item.totalPrice - costAtSale };
      })
    );

    const sale = Sale.create({ ...input, items: itemsWithCost });
    await this.saleRepo.save(sale);

    for (const item of sale.items) {
      const movement = StockMovement.createOut(item.productId, item.quantity, sale.id);
      await this.stockRepo.save(movement);
    }

    return sale;
  }

  async cancel(id: string, returnStock?: boolean): Promise<Sale> {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new SaleNotFoundError(id);

    const updated = sale.cancel();
    if (returnStock !== false) {
      await this.stockRepo.deleteByReference(id);
    }
    await this.saleRepo.save(updated);
    return updated;
  }

  async update(sale: Sale): Promise<void> {
    const updated = new Sale({ ...sale, updatedAt: new Date().toISOString() });
    await this.saleRepo.save(updated);
  }

  async updateInstallment(saleId: string, installment: Installment): Promise<void> {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new SaleNotFoundError(saleId);
    await this.saleRepo.saveInstallment(installment);
  }
}
```

**Arquivos:**
- `shared/application/services/SaleService.ts`
- `shared/application/services/ProductService.ts`
- `shared/application/services/ClientService.ts`
- `shared/application/services/TagService.ts`
- `shared/application/services/SettingsService.ts`
- `shared/application/services/errors.ts` (classes de erro: `SaleNotFoundError`, etc.)

---

### Fase 5 — Hooks Refatorados

Thin wrappers. Instanciam serviços com `useMemo` + `new`. APENAS hooks fazem `invalidateQueries`.

```typescript
// hooks/useCreateSale.ts
export function useCreateSale() {
  const queryClient = useQueryClient();
  const saleService = useMemo(
    () => new SaleService(new SaleRepository(), new ProductRepository(), new StockMovementRepository()),
    []
  );

  return useMutation({
    mutationFn: (input: CreateSaleInput) => saleService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

```typescript
// hooks/useProducts.ts
export function useProducts() {
  const repo = useMemo(() => new ProductRepository(), []);
  return useQuery({
    queryKey: ['products'],
    queryFn: () => repo.findAll(),
    staleTime: 1000 * 60 * 2,
  });
}
```

Helper opcional para evitar repetição:

```typescript
function useRepo<T>(factory: () => T): T {
  return useMemo(factory, []);
}
```

**O que muda em cada hook:**

| Hook | Antes | Depois |
|---|---|---|
| `useAllSales` | `db.getSales()` + `db.fromDbSale` | `new SaleRepository().findAll()` |
| `useProducts` | `db.getProducts()` + `fromDbProduct` local | `new ProductRepository().findAll()` |
| `useClients` | `db.getClients()` + `fromDbClient` local | `new ClientRepository().findAll()` |
| `useTags` | `db.getTags()` + `fromDbTag` local | `new TagRepository().findAll()` |
| `useCreateSale` | `SaleService.create()` | `new SaleService(..).create()` com invalidação completa |
| `useCreateClient` | `db.saveClient()` inline | `new ClientService(..).create()` |
| `useEditSale` | `SaleService.update()` | `new SaleService(..).update()` (invalidate só no hook) |
| `useCancelSale` | `SaleService.cancel()` | `new SaleService(..).cancel()` (invalidate só no hook) |
| `useSettings` | `db.getAllSettings()` | `new SettingsRepository().findAll()` |

---

### Fase 6 — Clean Code

- Remover `toDbSale`, `toDbSaleItem`, `toDbInstallment` do `sale-service.ts` (migrados para `Sale.ts`)
- Remover `fromDbProduct`, `fromDbClient`, `fromDbTag` duplicados dos hooks
- Remover `fromDbSale` do `db.ts` (migrado para `Sale.fromDb`)
- Padronizar nomenclatura: `getX` → `findX`, `saveX` → `upsertX` onde fizer sentido
- Extrair `sanitizeParams` de `db.ts` para um helper em `lib/database/utils.ts`
- Adicionar classes de erro específicas: `SaleNotFoundError`, `ProductNotFoundError`
- Nomes de arquivos em kebab-case (padrão do projeto)

---

### Fase 7 — Limpeza

- Remover `services/sale-service.ts` (antigo, substituído)
- Remover diretório `services/` (vazio)
- Remover `shared/types/` directory
- Atualizar `types/` barrel para apontar para `@shared/domain/entities/`
- Remover imports não utilizados em todas as screens
- Rodar `pnpm check` para validar compilação
- Rodar `pnpm test` (se houver testes)

---

## Padrões de Código (Clean Code)

### Nomenclatura
- Classes: `PascalCase` — `SaleService`, `SaleRepository`, `Sale`
- Interfaces: prefixo `I` — `ISaleRepository` (padrão escolhido para clareza vs types sem prefixo)
- Métodos/funções: `camelCase` — `findById`, `create`, `save`
- Arquivos: `kebab-case` — `sale-service.ts`, `product-repository.ts`
- Erros: `PascalCase` + sufixo `Error` — `SaleNotFoundError`

### Responsabilidade Única (SRP)
- **Entidade**: apenas estado + comportamento de domínio (validações, cálculos)
- **Repositório**: apenas persistência/recuperação (SQL, chamadas db.ts)
- **Serviço**: apenas orquestração de casos de uso (coordenar entidades + repositórios)
- **Hook**: apenas ligação React Query ↔ serviço (data fetching, cache)
- **Screen**: apenas UI (renderização, navegação)

### Inversão de Dependência (DIP)
- Serviços dependem de interfaces (`ISaleRepository`), não de implementações concretas
- Repositórios implementam interfaces e dependem de `db.ts` (concreto no fundo da pirâmide)
- Nenhum hook ou screen importa `db.ts`

### Imutabilidade
- Entidades são `readonly` — qualquer mutação retorna nova instância
- `cancel()` retorna nova Sale com status alterado, não modifica a original
- Evita efeitos colaterais em dados cacheados pelo React Query

---

## Arquivos Envolvidos

### Criar (23 arquivos)
- `shared/domain/entities/Sale.ts`
- `shared/domain/entities/Product.ts`
- `shared/domain/entities/Client.ts`
- `shared/domain/entities/Installment.ts`
- `shared/domain/entities/Tag.ts`
- `shared/domain/entities/StockMovement.ts`
- `shared/domain/entities/Settings.ts`
- `shared/domain/entities/index.ts`
- `shared/domain/value-objects/Money.ts`
- `shared/application/ports/ISaleRepository.ts`
- `shared/application/ports/IProductRepository.ts`
- `shared/application/ports/IClientRepository.ts`
- `shared/application/ports/ITagRepository.ts`
- `shared/application/ports/ISettingsRepository.ts`
- `shared/application/ports/IStockMovementRepository.ts`
- `shared/application/services/SaleService.ts`
- `shared/application/services/ProductService.ts`
- `shared/application/services/ClientService.ts`
- `shared/application/services/TagService.ts`
- `shared/application/services/SettingsService.ts`
- `shared/application/services/errors.ts`
- `lib/database/repositories/*.ts` (6 arquivos)
- `lib/database/utils.ts` (sanitizeParams)

### Modificar (13 arquivos)
- `hooks/useAllSales.ts`
- `hooks/useCreateSale.ts`
- `hooks/useEditSale.ts`
- `hooks/useCancelSale.ts`
- `hooks/useUpdateInstallment.ts`
- `hooks/useProducts.ts`
- `hooks/useProduct.ts`
- `hooks/useClients.ts`
- `hooks/useClient.ts`
- `hooks/useCreateClient.ts`
- `hooks/useTags.ts`
- `hooks/useSettings.ts`
- `hooks/useSalesByMonth.ts`

### Remover (2+ arquivos)
- `services/sale-service.ts`
- `services/` directory
- `shared/types/` directory
- `lib/database/db.ts` — remover `fromDbSale`, `toDbSale`, `toDbSaleItem`, `toDbInstallment`
