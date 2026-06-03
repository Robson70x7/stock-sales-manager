## ADDED Requirements

### Requirement: Produto deve ter averageCost

O schema de produtos MUST incluir o campo `averageCost REAL DEFAULT 0` para rastreamento de custo médio ponderado.

#### Scenario: Produto sem movimentações

- **WHEN** um produto é criado
- **AND** não há movimentações de estoque
- **THEN** `averageCost` MUST ser 0

#### Scenario: Produto com movimentações de entrada

- **WHEN** uma movimentação de entrada é registrada com `unitCost` e `totalCost`
- **THEN** o `averageCost` do produto MUST ser atualizado via weighted average
- **AND** o cálculo MUST seguir a fórmula `((estoque_anterior * averageCost_anterior) + totalCost) / estoque_novo`

### Requirement: Produto deve ter suporte a tags M2M

O sistema MUST ter tabela `product_tags` para relacionamento muitos-para-muitos entre produtos e tags.

#### Scenario: Produto vinculado a tags

- **WHEN** um produto é sincronizado do desktop com tags
- **THEN** o sistema MUST armazenar as relações na tabela `product_tags`
- **AND** a listagem de tags do produto MUST consultar a tabela junction

#### Scenario: Pull de catálogo com tags

- **WHEN** o mobile faz pull de produtos do desktop
- **AND** o desktop envia produtos com `tagIds`
- **THEN** o sistema MUST criar as entradas correspondentes em `product_tags`
- **AND** MUST remover relações que não estão mais presentes

### Requirement: Cliente deve ter suporte a tags M2M

O sistema MUST ter tabela `client_tags` para relacionamento muitos-para-muitos entre clientes e tags.

#### Scenario: Cliente vinculado a tags

- **WHEN** um cliente é sincronizado do desktop com tags
- **THEN** o sistema MUST armazenar as relações na tabela `client_tags`
- **AND** a listagem de tags do cliente MUST consultar a tabela junction

### Requirement: Supplier deve ter campos completos

A tabela `suppliers` MUST incluir os campos `website TEXT`, `pix TEXT`, `address TEXT`.

#### Scenario: Supplier sincronizado com dados completos

- **WHEN** um fornecedor é sincronizado do desktop
- **AND** o desktop envia `website`, `pix`, `address`
- **THEN** o sistema MUST armazenar todos os campos
- **AND** a tela de detalhes do fornecedor MUST exibir esses campos

### Requirement: Sale item deve ter UUID e campos de custo/lucro

A tabela `sale_items` MUST ter `id TEXT PRIMARY KEY` (UUID), `costAtSale REAL`, `profitAmount REAL` e `status TEXT DEFAULT 'active'`.

#### Scenario: Venda criada com cálculo de custo

- **WHEN** uma venda é criada
- **THEN** cada `sale_item` MUST ter `id` UUID gerado
- **AND** `costAtSale` MUST ser `quantity * product.averageCost`
- **AND** `profitAmount` MUST ser `totalPrice - costAtSale`
- **AND** `status` MUST ser `'active'`

#### Scenario: Venda existente sem custo

- **WHEN** uma venda existente (criada antes da migration) é visualizada
- **THEN** `costAtSale` e `profitAmount` DEVEM ser `null`
- **AND** o sistema MUST exibir "N/A" para lucro

### Requirement: Installment deve ter campo type

A tabela `installments` MUST ter campo `type TEXT DEFAULT 'normal'` com valores `'normal'` ou `'entry'`.

#### Scenario: Venda com entrada

- **WHEN** uma venda tem `entryAmount > 0`
- **THEN** o primeiro installment MUST ter `type = 'entry'`
- **AND** os demais installments DEVEM ter `type = 'normal'`

#### Scenario: Venda sem entrada

- **WHEN** uma venda tem `entryAmount = 0`
- **THEN** todos os installments DEVEM ter `type = 'normal'`
