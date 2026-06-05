## ADDED Requirements

### Requirement: WebSocket adapter substitui handshake por autenticação

O adapter `LocalP2PSyncAdapter` DEVE substituir o handshake antigo (`handshake`/`handshake_ack`) por um fluxo de autenticação com username e senha.

#### Scenario: Conexão bem-sucedida com auth

- **WHEN** o adapter `connect()` é chamado
- **AND** a conexão WebSocket é estabelecida
- **THEN** o adapter MUST resolver a promise de conexão no `onopen`
- **AND** MUST NÃO enviar mensagem `handshake`
- **AND** MUST aguardar chamada explícita de `authenticate()`

#### Scenario: Authenticate com credenciais válidas

- **WHEN** `adapter.authenticate(username, password)` é chamado
- **AND** o servidor responde com `auth_response` status `ok`
- **THEN** o adapter MUST armazenar o `token` internamente
- **AND** MUST armazenar os dados do `user`
- **AND** MUST resolver a promise com `{ token, user, encryptionSalt }`
- **AND** `isAuthenticated()` MUST retornar `true`
- **AND** `getToken()` MUST retornar o token

#### Scenario: Authenticate com credenciais inválidas

- **WHEN** `adapter.authenticate(username, password)` é chamado
- **AND** o servidor responde com `auth_response` status `error`
- **THEN** o adapter MUST rejeitar a promise com mensagem "Credenciais inválidas"
- **AND** `isAuthenticated()` MUST retornar `false`
- **AND** o adapter MUST manter a conexão WebSocket aberta (pode tentar novamente)

#### Scenario: Authenticate timeout

- **WHEN** `adapter.authenticate()` é chamado
- **AND** não há resposta do servidor em 10 segundos
- **THEN** o adapter MUST rejeitar a promise com "Timeout de autenticação"
- **AND** MUST desconectar o WebSocket

### Requirement: Mensagens incluem token JWT

Todas as mensagens enviadas após autenticação DEVEM incluir o token JWT.

#### Scenario: Pull com token

- **WHEN** `adapter.sync({ type: 'pull', entity: 'products' })` é chamado
- **AND** o adapter está autenticado
- **THEN** a mensagem enviada MUST incluir `token: "<jwt>"`

#### Scenario: Sale com token

- **WHEN** `adapter.sync({ type: 'sale', data: sale })` é chamado
- **AND** o adapter está autenticado
- **THEN** a mensagem enviada MUST incluir `token: "<jwt>"`

#### Scenario: Sync sem token lança erro

- **WHEN** `adapter.sync()` é chamado
- **AND** o adapter NÃO está autenticado
- **THEN** o adapter MUST rejeitar com "Não autenticado. Execute authenticate() primeiro."
