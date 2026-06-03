## ADDED Requirements

### Requirement: Enviar venda para o desktop

O sistema MUST enviar vendas criadas no mobile para o desktop após sync.

#### Scenario: Venda criada no mobile é enviada

- **WHEN** o usuário cria uma venda no mobile
- **AND** a conexão com o desktop está ativa
- **AND** o usuário inicia sync
- **THEN** o sistema MUST enviar `{ type: "sale", data: Sale }` para o desktop
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

### Requirement: Rastrear status de sync das vendas

O sistema MUST manter um campo de status de sync para cada venda.

#### Scenario: Venda aguardando sync

- **WHEN** uma venda é criada no mobile
- **AND** não há conexão com desktop no momento
- **THEN** a venda MUST ter `syncStatus = "pending"`
- **AND** MUST ser elegível para envio no próximo sync

#### Scenario: Consulta de vendas não sincronizadas

- **WHEN** o usuário visualiza a lista de vendas
- **THEN** vendas com `syncStatus != "synced"` DEVEM exibir um indicador visual de "não sincronizado"
