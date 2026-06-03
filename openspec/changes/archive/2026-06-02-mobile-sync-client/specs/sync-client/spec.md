## ADDED Requirements

### Requirement: Conectar ao SyncServer do desktop

O sistema MUST estabelecer conexão WebSocket com o SyncServer do desktop na porta 9999.

#### Scenario: Conexão bem-sucedida

- **WHEN** o mobile tenta conectar ao desktop em `ws://<desktop-ip>:9999`
- **AND** o desktop está ouvindo na porta
- **THEN** a conexão WebSocket MUST ser estabelecida com sucesso
- **AND** o sistema MUST atualizar o estado de sync para `connected`

#### Scenario: Desktop não está disponível

- **WHEN** o mobile tenta conectar ao desktop
- **AND** o desktop não está na rede ou a porta está fechada
- **THEN** a conexão MUST falhar com timeout ou recusa
- **AND** o sistema MUST atualizar o estado de sync para `error` com mensagem descritiva

### Requirement: Handshake na conexão

O sistema MUST enviar uma mensagem de handshake ao conectar e aguardar confirmação.

#### Scenario: Handshake bem-sucedido

- **WHEN** a conexão WebSocket é estabelecida
- **AND** o mobile envia `{ type: "handshake", version: "1.0", deviceId: "<mobile-device-id>" }`
- **AND** o desktop responde com `{ type: "handshake_ack", version: "1.0", deviceId: "<desktop-device-id>" }`
- **THEN** o sistema MUST registrar o desktop como conectado
- **AND** MUST armazenar o `deviceId` e `version` do desktop

#### Scenario: Handshake sem resposta

- **WHEN** o mobile envia handshake
- **AND** não recebe resposta em 5 segundos
- **THEN** o sistema MUST fechar a conexão
- **AND** MUST atualizar estado para `error` com mensagem "Handshake timeout"

### Requirement: Reconexão automática

O sistema MUST tentar reconectar automaticamente em caso de queda de conexão.

#### Scenario: Conexão perdida durante sync

- **WHEN** a conexão WebSocket é fechada inesperadamente
- **THEN** o sistema MUST tentar reconectar com backoff exponencial (1s, 2s, 4s, 8s, max 30s)
- **AND** MUST atualizar o estado de sync para `reconnecting`

#### Scenario: Reconexão bem-sucedida

- **WHEN** a reconexão automática estabelece nova conexão
- **THEN** o sistema MUST executar handshake novamente
- **AND** MUST retomar operações pendentes (pull ou envio de vendas)
- **AND** MUST atualizar estado para `connected`

### Requirement: Roteamento de mensagens

O sistema MUST rotear mensagens recebidas do WebSocket para os handlers apropriados.

#### Scenario: Mensagem pull_result recebida

- **WHEN** o sistema recebe `{ type: "pull_result", entity: "products", data: [...], timestamp: "..." }`
- **THEN** MUST encaminhar para o handler de pull-catalog
- **AND** MUST processar os dados recebidos

#### Scenario: Mensagem ack recebida

- **WHEN** o sistema recebe `{ type: "ack", saleId: "...", status: "ok"|"error", warnings?: [...] }`
- **THEN** MUST encaminhar para o handler de sale-ingestion
- **AND** MUST atualizar o status da venda conforme o ack
