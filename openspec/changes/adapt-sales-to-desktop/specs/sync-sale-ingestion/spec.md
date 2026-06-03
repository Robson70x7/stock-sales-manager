## ADDED Requirements

### Requirement: Enviar sale_items com costAtSale e profitAmount

O sistema MUST incluir `costAtSale` e `profitAmount` nos `sale_items` ao enviar venda para o desktop.

#### Scenario: Venda com custo calculado

- **WHEN** o mobile envia uma venda para o desktop
- **AND** a venda possui `sale_items` com `costAtSale` e `profitAmount`
- **THEN** o payload enviado MUST incluir esses campos para cada item
- **AND** o formato MUST ser `{ productId, productName, quantity, unitPrice, totalPrice, costAtSale, profitAmount, status }`

### Requirement: Enviar installments com campo type

O sistema MUST incluir `type` nos installments ao enviar venda para o desktop.

#### Scenario: Venda com installment type

- **WHEN** o mobile envia uma venda para o desktop
- **AND** a venda possui `installments` com `type`
- **THEN** o payload enviado MUST incluir `type` para cada installment
- **AND** o formato MUST ser `{ id, number, totalInstallments, amount, dueDate, paidDate, status, history, type }`

### Requirement: Receber ack com validação de custo

O sistema MUST processar o ack do desktop incluso para validações de custo/lucro.

#### Scenario: Venda aceita com validação de custo

- **WHEN** o desktop responde `{ type: "ack", saleId: "<id>", status: "ok" }`
- **THEN** o sistema MUST marcar a venda como sincronizada
- **AND** MUST manter os valores de `costAtSale` e `profitAmount` calculados localmente

## MODIFIED Requirements

### Requirement: Enviar venda para o desktop

O sistema MUST enviar vendas criadas no mobile para o desktop após sync, incluindo todos os novos campos.

#### Scenario: Venda criada no mobile é enviada

- **WHEN** o usuário cria uma venda no mobile
- **AND** a conexão com o desktop está ativa
- **AND** o usuário inicia sync
- **THEN** o sistema MUST enviar `{ type: "sale", data: Sale }` para o desktop
- **AND** os `sale_items` DEVEM incluir `costAtSale`, `profitAmount`, `status`
- **AND** os `installments` DEVEM incluir `type`
- **AND** MUST aguardar resposta de ack

#### Scenario: Múltiplas vendas pendentes

- **WHEN** existem múltiplas vendas criadas offline
- **AND** a conexão com desktop é estabelecida
- **THEN** o sistema MUST enviar cada venda sequencialmente
- **AND** MUST processar cada ack antes de enviar a próxima

### Requirement: Processar ack do desktop

O sistema MUST processar a resposta do desktop para cada venda enviada.

#### Scenario: Venda aceita (status ok)

- **WHEN** o desktop responde `{ type: "ack", saleId: "<id>", status: "ok" }`
- **THEN** o sistema MUST marcar a venda como sincronizada (`synced = true`)
- **AND** MUST manter a venda no banco local como referência

#### Scenario: Venda aceita com warnings (over-sell)

- **WHEN** o desktop responde `{ type: "ack", saleId: "<id>", status: "ok", warnings: Warning[] }`
- **THEN** o sistema MUST marcar a venda como sincronizada
- **AND** MUST exibir os warnings para o usuário
- **AND** MUST armazenar os warnings no registro da venda

#### Scenario: Venda rejeitada (status error)

- **WHEN** o desktop responde `{ type: "ack", saleId: "<id>", status: "error", message: "..." }`
- **THEN** o sistema MUST marcar a venda com status de sync `failed`
- **AND** MUST armazenar a mensagem de erro
- **AND** MUST NOT excluir a venda local
- **AND** MUST permitir reenvio futuro
