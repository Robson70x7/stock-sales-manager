## ADDED Requirements

### Requirement: Pull completo do catálogo

O sistema MUST solicitar e receber todos os registros de uma entidade do desktop.

#### Scenario: Pull de produtos

- **WHEN** o usuário inicia sync
- **AND** o mobile envia `{ type: "pull", entity: "products" }`
- **AND** o desktop responde com `{ type: "pull_result", entity: "products", data: Product[], timestamp: "..." }`
- **THEN** o sistema MUST atualizar a tabela `products` local com os dados recebidos
- **AND** MUST substituir produtos existentes (mesmo `id`) pelos dados do desktop
- **AND** MUST marcar como `isDeleted = 1` produtos locais que não vieram na resposta (desktop é fonte da verdade)

#### Scenario: Pull de clientes

- **WHEN** o mobile envia `{ type: "pull", entity: "clients" }`
- **AND** o desktop responde com dados de clientes
- **THEN** o sistema MUST atualizar a tabela `clients` local seguindo a mesma lógica de merge

#### Scenario: Pull de tags

- **WHEN** o mobile envia `{ type: "pull", entity: "tags" }`
- **AND** o desktop responde com dados de tags
- **THEN** o sistema MUST atualizar a tabela `tags` local seguindo a mesma lógica de merge

### Requirement: Pull incremental desde timestamp

O sistema MUST suportar pull diferencial para evitar tráfego desnecessário.

#### Scenario: Pull incremental após primeiro sync

- **WHEN** o mobile já possui dados sincronizados anteriormente
- **AND** envia `{ type: "pull", entity: "products", since: "<ultimo-timestamp>" }`
- **THEN** o desktop MUST responder apenas com registros alterados após o timestamp
- **AND** o sistema MUST aplicar apenas as diferenças no banco local
- **AND** MUST atualizar o timestamp de último sync

#### Scenario: Entidade sem alterações

- **WHEN** o mobile solicita pull incremental
- **AND** não há registros alterados desde o timestamp
- **THEN** o desktop MUST responder com `data: []`
- **AND** o sistema MUST manter os dados locais inalterados

### Requirement: Resiliência a falhas no pull

O sistema MUST lidar com falhas durante o pull sem corromper dados locais.

#### Scenario: Pull interrompido

- **WHEN** o pull é interrompido (desconexão, timeout)
- **THEN** o sistema MUST manter os dados locais no estado anterior ao pull
- **AND** MUST marcar o sync como `error`
- **AND** MUST permitir retentar o pull completo

#### Scenario: Dados inválidos na resposta

- **WHEN** o desktop retorna dados com formato inválido
- **THEN** o sistema MUST rejeitar o pull
- **AND** MUST logar erro
- **AND** MUST manter dados locais intactos
