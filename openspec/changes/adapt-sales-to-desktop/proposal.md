## Why

O mobile foi construído com um schema simplificado que não reflete a estrutura completa do desktop (Electron). Como o desktop é a fonte da verdade para dados mestres e o sync P2P já está em andamento, precisamos alinhar o schema do banco, os tipos compartilhados e o fluxo de criação de vendas do mobile com a estrutura do desktop para que a sincronização funcione corretamente.

## What Changes

### Schema de banco de dados
- **PRODUTOS**: Adicionar `averageCost` e tabela `product_tags` (M2M) — atualmente produtos não têm relação com tags no mobile
- **CLIENTES**: Adicionar tabela `client_tags` (M2M) — atualmente clientes não têm relação com tags no mobile
- **FORNECEDORES**: Adicionar campos `website`, `pix`, `address` — atualmente fornecedores têm schema mínimo
- **SALE ITEMS**: Adicionar `id` (UUID), `costAtSale`, `profitAmount` — atualmente sale_items não têm PK UUID nem custo/lucro
- **INSTALLMENTS**: Adicionar campo `type` ('normal' | 'entry') — atualmente não há distinção entre parcela normal e de entrada

### Fluxo de criação de vendas
- Calcular `costAtSale` e `profitAmount` ao criar venda, consultando o `averageCost` do produto
- Gerar parcelas com `type: 'entry'` para a entrada e `type: 'normal'` para as demais
- Atualizar estoque usando `stock_movements` com `reason: 'sale'` e `balanceAfter`
- Atualizar `averageCost` do produto conforme movimentação de saída

### Sync
- O pull de catálogo (`sync-pull-catalog`) deve incluir as relações M2M (product_tags, client_tags)
- O envio de vendas (`sync-sale-ingestion`) deve incluir os novos campos (costAtSale, profitAmount, type nos installments)

### Tipos compartilhados
- Alinhar `shared/types/index.ts` com os tipos do desktop, adicionando campos faltantes em todas as entidades

## Capabilities

### New Capabilities
- `entity-alignment`: Alinhamento de schema de banco e tipos das entidades (products, clients, suppliers, sales, sale_items, installments) com a estrutura do desktop
- `tag-linking`: Suporte a relacionamentos M2M entre produtos/tags e clientes/tags via tabelas junction
- `sale-cost-tracking`: Cálculo e armazenamento de custo e lucro por item na venda

### Modified Capabilities
- `pdv-default`: Schema de entidades agora inclui campos do desktop; cadastros continuam read-only (vindos do desktop via sync)
- `sync-pull-catalog`: Pull agora inclui dados de `product_tags`, `client_tags` e novos campos
- `sync-sale-ingestion`: Vendas enviadas agora incluem `costAtSale`, `profitAmount` e `installments[].type`

## Impact

- **Banco de dados**: Novas migrações SQL para adicionar colunas e tabelas
- **lib/database/db.ts**: Conversores (toDb/fromDb) e funções CRUD precisam ser atualizados para novos campos
- **shared/types/index.ts**: Interfaces Product, Client, Supplier, SaleItem, Installment ganham novos campos
- **context/AppContext.tsx**: addSale, updateProduct, addStockMovement precisam lidar com averageCost, tagIds, custo/lucro
- **app/sales/new.tsx**: Fluxo de criação de venda precisa calcular costAtSale/profitAmount
- **shared/sync/**: Handlers de pull e sale precisam serializar/deserializar novos campos e relações M2M
- **lib/utils.ts**: generateInstallments precisa adicionar type: 'entry' | 'normal'
