## ADDED Requirements

### Requirement: Sincronizar relações M2M de tags no pull

O sistema MUST sincronizar as tabelas `product_tags` e `client_tags` durante o pull de catálogo do desktop.

#### Scenario: Pull de produtos com tags

- **WHEN** o mobile recebe `pull_result` com `entity: "products"`
- **AND** os produtos incluem campo `tagIds: string[]`
- **THEN** o sistema MUST inserir relações em `product_tags` para cada `tagId`
- **AND** MUST remover relações `product_tags` cujo `tagId` não está mais na lista
- **AND** a operação MUST ser atômica (transação)

#### Scenario: Pull de clientes com tags

- **WHEN** o mobile recebe `pull_result` com `entity: "clients"`
- **AND** os clientes incluem campo `tagIds: string[]`
- **THEN** o sistema MUST inserir relações em `client_tags` para cada `tagId`
- **AND** MUST remover relações `client_tags` cujo `tagId` não está mais na lista

### Requirement: Exibir tags de produtos e clientes

O sistema MUST exibir as tags vinculadas a produtos e clientes nas telas de detalhes.

#### Scenario: Detalhe do produto com tags

- **WHEN** o usuário visualiza o detalhe de um produto
- **THEN** as tags do produto DEVEM ser exibidas como chips coloridos
- **AND** o usuário MUST NÃO poder editar as tags (cadastro é read-only do desktop)

#### Scenario: Detalhe do cliente com tags

- **WHEN** o usuário visualiza o detalhe de um cliente
- **THEN** as tags do cliente DEVEM ser exibidas como chips coloridos
- **AND** o usuário MUST NÃO poder editar as tags
