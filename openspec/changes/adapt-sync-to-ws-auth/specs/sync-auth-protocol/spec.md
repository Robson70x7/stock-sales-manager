## ADDED Requirements

### Requirement: Novo tipo de mensagem auth_request

O mobile DEVE enviar `auth_request` como primeira mensagem após conexão WebSocket.

#### Scenario: Envio de auth_request

- **WHEN** o adapter está conectado via WebSocket
- **AND** `authenticate(username, password)` é chamado
- **THEN** o adapter MUST calcular `SHA-256(password)` para obter `passwordHash`
- **AND** MUST enviar `{ type: "auth_request", username: "<username>", passwordHash: "<sha256>" }`
- **AND** MUST aguardar resposta do servidor

### Requirement: Processamento de auth_response

O mobile DEVE processar corretamente a resposta de autenticação do servidor.

#### Scenario: Auth bem-sucedido

- **WHEN** o adapter recebe `{ type: "auth_response", status: "ok", token: "<jwt>", encryptionSalt: "<hex>", user: { id, name, username, roleName, permissions[] } }`
- **THEN** o adapter MUST extrair e armazenar `token`, `encryptionSalt` e `user`
- **AND** MUST resolver a promise de `authenticate()`

#### Scenario: Auth recusado

- **WHEN** o adapter recebe `{ type: "auth_response", status: "error", message: "Credenciais inválidas" }`
- **THEN** o adapter MUST rejeitar a promise de `authenticate()`
- **AND** a mensagem de erro DEVE ser propagada para a UI

### Requirement: Handshake antigo removido

O mobile NÃO DEVE mais enviar mensagens do tipo `handshake`.

#### Scenario: Regressão de handshake

- **WHEN** o adapter conecta ao servidor
- **THEN** o adapter MUST NÃO enviar `{ type: "handshake", version, deviceId }`
- **AND** o adapter MUST NÃO processar `handshake_ack`
- **AND** o código de handshake DEVE ser removido

### Requirement: Users e Roles não são sincronizados em massa

O `SyncManager` NÃO DEVE mais fazer pull de `users` e `roles` durante `syncAll()`.

#### Scenario: SyncAll sem users/roles

- **WHEN** `syncAll()` é chamado
- **THEN** o SyncManager MUST NÃO chamar `pullCatalog` para entidade `users`
- **AND** MUST NÃO chamar `pullCatalog` para entidade `roles`
- **AND** MUST continuar sincronizando `products`, `clients`, `tags`, `suppliers`

#### Scenario: Usuário autenticado é persistido separadamente

- **WHEN** `auth_response` retorna dados do usuário
- **THEN** o app DEVE salvar esse usuário no SQLite via `AuthService.createSessionFromUser()`
- **AND** DEVE criar sessão ativa
- **AND** NÃO DEVE sincronizar a lista completa de usuários do desktop
