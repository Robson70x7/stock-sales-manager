## ADDED Requirements

### Requirement: Pull deve incluir product_tags e client_tags

O sistema MUST sincronizar as relações M2M de tags durante o pull de catálogo, além dos dados das entidades.

#### Scenario: Pull de produtos com relações de tags

- **WHEN** o mobile recebe `pull_result` com `entity: "products"`
- **AND** os produtos incluem campo `tagIds: string[]`
- **THEN** o sistema MUST limpar `product_tags` para produtos existentes antes de reinserir
- **AND** MUST inserir relações em `product_tags` para cada combinação produto/tag
- **AND** a operação MUST ser atômica (transação SQL)

#### Scenario: Pull de clientes com relações de tags

- **WHEN** o mobile recebe `pull_result` com `entity: "clients"`
- **AND** os clientes incluem campo `tagIds: string[]`
- **THEN** o sistema MUST limpar `client_tags` para clientes existentes antes de reinserir
- **AND** MUST inserir relações em `client_tags` para cada combinação cliente/tag

### Requirement: Pull deve incluir averageCost dos produtos

O sistema MUST receber e armazenar o campo `averageCost` dos produtos durante o pull.

#### Scenario: Produto com averageCost no pull

- **WHEN** o mobile recebe `pull_result` com `entity: "products"`
- **AND** os produtos incluem `averageCost`
- **THEN** o sistema MUST armazenar `averageCost` no banco local
- **AND** MUST sobrescrever o valor local com o valor do desktop

### Requirement: Pull de suppliers deve incluir campos estendidos

O sistema MUST receber e armazenar os campos `website`, `pix`, `address` dos fornecedores.

#### Scenario: Supplier com dados completos

- **WHEN** o mobile recebe `pull_result` com `entity: "suppliers"`
- **AND** os fornecedores incluem `website`, `pix`, `address`
- **THEN** o sistema MUST armazenar todos os campos no banco local

## MODIFIED Requirements

### Requirement: Pull completo do catálogo

O sistema MUST solicitar e receber todos os registros de uma entidade do desktop, incluindo relações M2M e novos campos.

#### Scenario: Pull de produtos

- **WHEN** o usuário inicia sync
- **AND** o mobile envia `{ type: "pull", entity: "products" }`
- **AND** o desktop responde com `{ type: "pull_result", entity: "products", data: Product[], timestamp: "..." }`
- **AND** os dados incluem `tagIds`, `averageCost`
- **THEN** o sistema MUST atualizar a tabela `products` local com os dados recebidos
- **AND** MUST substituir produtos existentes (mesmo `id`) pelos dados do desktop
- **AND** MUST atualizar `product_tags` conforme `tagIds` de cada produto
- **AND** MUST marcar como `isDeleted = 1` produtos locais que não vieram na resposta

#### Scenario: Pull de clientes

- **WHEN** o mobile envia `{ type: "pull", entity: "clients" }`
- **AND** o desktop responde com dados de clientes que incluem `tagIds`
- **THEN** o sistema MUST atualizar a tabela `clients` local
- **AND** MUST atualizar `client_tags` conforme `tagIds` de cada cliente

#### Scenario: Pull de tags

- **WHEN** o mobile envia `{ type: "pull", entity: "tags" }`
- **AND** o desktop responde com dados de tags
- **THEN** o sistema MUST atualizar a tabela `tags` local seguindo a mesma lógica de merge

### Requirement: Pull incremental desde timestamp

O sistema MUST suportar pull diferencial para evitar tráfego desnecessário, incluindo relações M2M.

#### Scenario: Pull incremental após primeiro sync

- **WHEN** o mobile já possui dados sincronizados anteriormente
- **AND** envia `{ type: "pull", entity: "products", since: "<ultimo-timestamp>" }`
- **THEN** o desktop MUST responder apenas com registros alterados após o timestamp
- **AND** o sistema MUST aplicar apenas as diferenças no banco local
- **AND** MUST atualizar `product_tags` conforme `tagIds` dos produtos alterados
- **AND** MUST atualizar o timestamp de último sync
