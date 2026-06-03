## Context

O mobile foi desenvolvido com schema SQLite simplificado que difere do desktop em vários aspectos: produtos e clientes não têm relação M2M com tags, sale_items não têm UUID/custo/lucro, installments não têm `type`, e suppliers não têm campos completos. O sync P2P já está implementado via WebSocket e mDNS, mas os dados enviados/recebidos não estão alinhados.

O desktop usa `better-sqlite3` com 42 migrations e arquitetura CQRS. O mobile usa `expo-sqlite` com migrations SQL sequenciais. Ambos são SQLite — a compatibilidade de schema é direta.

### Schema atual (mobile) vs desktop (alvo)

| Entidade | Mobile | Desktop |
|---|---|---|
| products | sem tags, sem averageCost | M2M product_tags, averageCost |
| clients | sem tags | M2M client_tags |
| suppliers | sem website/pix/address | com website/pix/address |
| sale_items | sem id (INTEGER PK), sem costAtSale, sem profitAmount | id TEXT PK, costAtSale, profitAmount |
| installments | sem type (entry/normal) | type TEXT DEFAULT 'normal' |

## Goals / Non-Goals

**Goals:**
- Alinhar schema SQLite mobile com o desktop para todas as entidades compartilhadas
- Adicionar averageCost, product_tags, client_tags, campos de supplier, costAtSale/profitAmount, type em installments
- Atualizar fluxo de criação de vendas para calcular custo/lucro por item
- Atualizar sync pull para incluir relações M2M e novos campos
- Atualizar sync push (sale) para incluir costAtSale/profitAmount/installment.type
- Manter compatibilidade retroativa com dados existentes (migrations sem quebra)

**Non-Goals:**
- Não implementar purchases (compras) — ficam só no desktop
- Não implementar financial_entries / accounts_payable — ficam só no desktop
- Não implementar inventory_sessions / return_requests
- Não alterar a arquitetura de estado (AppContext continuará sendo usado)

## Decisions

### 1. Migrations incrementais, não schema reset
**Decisão**: Criar novas migrations SQL (v7, v8, v9...) em vez de recriar o schema do zero.
**Motivo**: Dados existentes de vendas offline não podem ser perdidos. Migrations com `ALTER TABLE ADD COLUMN` e criação de novas tabelas são seguras em SQLite.
**Alternativa**: Reset total foi rejeitado — perderia vendas offline.

### 2. averageCost via stock_movements, não coluna direta
**Decisão**: Calcular `averageCost` via weighted average nas movimentações de estoque, igual ao desktop.
**Motivo**: O desktop usa `ProductStock.calculateWeightedAverageCost()` que atualiza o averageCost do produto a cada movimentação. O mobile já tem stock_movements — vamos estender para carregar `unitCost` e `totalCost` e atualizar `products.averageCost`.
**Alternativa**: Manter costPrice como único campo foi rejeitado — o desktop usa averageCost para cálculo de lucro.

### 3. Tags M2M via tabelas junction, não JSON array
**Decisão**: Criar `product_tags` e `client_tags` igual ao desktop; manter `sales.tagIds` como JSON array (já é assim no desktop).
**Motivo**: Consistência com o desktop para dados mestres. Para vendas, o JSON array é mais simples e o desktop já usa essa abordagem.
**Alternativa**: JSON array em produtos/clientes foi rejeitado — M2M é mais queryável e consistente com o desktop.

### 4. Sale item cost/profit calculado na criação da venda
**Decisão**: Ao criar venda, consultar `averageCost` do produto e calcular `costAtSale = quantity * averageCost` e `profitAmount = totalPrice - costAtSale`, igual ao `SaleService.processItems()` do desktop.
**Motivo**: O desktop calcula no handler `CreateSaleHandler` — precisamos do mesmo cálculo para que o sync envie dados consistentes.
**Alternativa**: Calcular no desktop após sync foi rejeitado — o mobile precisa ter autonomia offline.

### 5. UUID para sale_items (migração com fallback)
**Decisão**: Alterar PK de `sale_items.id` de INTEGER AUTOINCREMENT para TEXT UUID. Criar nova coluna `uuid` primeiro, popular com UUIDs, depois migrar constraints.
**Motivo**: O desktop usa UUID para todos os IDs. Consistência para sync e para referência em futuras entidades (return_items referenciam sale_item id).
**Alternativa**: Manter INTEGER foi rejeitado — incompatível com o desktop e complexo para sync.

## Risks / Trade-offs

- **[Migração de sale_items]** Alterar PK de INTEGER para TEXT pode quebrar queries existentes se não for feito com cuidado → Estratégia: ADD COLUMN uuid, preencher, migrar FK, depois dropar coluna id antiga e renomear
- **[Dados existentes sem costAtSale]** Vendas existentes não terão `costAtSale` — aceitável, novos cálculos só para vendas futuras
- **[Performance]** averageCost via stock_movements é mais caro que coluna direta → Aceitável para volume de PDV (centenas, não milhões)
- **[Sync]** Versões antigas do desktop podem não reconhecer novos campos → Mobile deve tratar graceful degradation no ack
