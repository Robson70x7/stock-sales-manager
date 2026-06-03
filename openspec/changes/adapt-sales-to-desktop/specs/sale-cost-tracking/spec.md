## ADDED Requirements

### Requirement: Calcular custo e lucro na criação de venda

O sistema MUST calcular `costAtSale` e `profitAmount` para cada item ao criar uma venda.

#### Scenario: Criação de venda com cálculo automático

- **WHEN** o usuário cria uma venda com produtos
- **THEN** para cada item, o sistema MUST consultar o `averageCost` atual do produto
- **AND** MUST calcular `costAtSale = quantity * averageCost`
- **AND** MUST calcular `profitAmount = totalPrice - costAtSale`
- **AND** MUST armazenar ambos no registro do `sale_item`

#### Scenario: Produto sem averageCost

- **WHEN** um produto tem `averageCost = 0`
- **THEN** `costAtSale` MUST ser 0
- **AND** `profitAmount` MUST ser igual a `totalPrice` (lucro bruto total)

### Requirement: Registrar movimentação de estoque com custo

O sistema MUST registrar `unitCost` e `totalCost` nas movimentações de estoque do tipo 'out' (venda).

#### Scenario: Movimentação de saída por venda

- **WHEN** uma venda é criada
- **AND** o sistema gera movimentação de estoque `type: 'out'`
- **THEN** a movimentação MUST ter `unitCost = product.averageCost`
- **AND** `totalCost = quantity * averageCost`
- **AND** `reason = 'sale'`
- **AND** `balanceAfter` MUST ser o saldo atualizado após a saída

### Requirement: Atualizar averageCost na movimentação de entrada

O sistema MUST recalcular o `averageCost` do produto ao registrar movimentações de entrada.

#### Scenario: Entrada de estoque com custo

- **WHEN** uma movimentação de entrada é registrada com `unitCost` e `totalCost`
- **THEN** o sistema MUST calcular novo `averageCost` via weighted average
- **AND** MUST atualizar `products.averageCost` no banco
- **AND** a fórmula MUST ser: `((currentStock * currentAvgCost) + totalCost) / (currentStock + quantity)`
