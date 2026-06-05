## 1. Tipos do Protocolo

- [x] 1.1 Adicionar `'auth_request' | 'auth_response'` ao `DesktopSyncMessageType` em `types.ts`
- [x] 1.2 Adicionar `token?: string`, `encryptionSalt?: string`, `passwordHash?: string`, `username?: string` ao `DesktopSyncMessage`
- [x] 1.3 Adicionar campo `user?: { id: string; name: string; username: string; roleName: string; permissions: string[] }` ao `DesktopSyncMessage`

## 2. AuthService — criação de sessão a partir de user externo

- [x] 2.1 Criar método `AuthService.createSessionFromUser(user, token)` em `auth-service.ts`:
  - Salva o usuário na tabela `users` (se já existir, atualiza)
  - Cria sessão ativa em `active_session`
  - Retorna `AuthenticatedUser`
- [x] 2.2 Adicionar campo `syncToken` na tabela `active_session` (migration v13)

## 3. Adapter — autenticação WebSocket

- [x] 3.1 Em `LocalP2PSyncAdapter`:
  - Adicionar campos privados: `authToken: string | null`, `sessionUser: any`, `authResolve/Reject`
  - Remover `handshakeResolve/Reject`, `handshakeTimeout`
  - Remover `performHandshake()` e `startHandshakeTimeout()`
- [x] 3.2 Criar método `authenticate(username: string, password: string): Promise<{ token: string; user: any; encryptionSalt: string }>`:
  - Calcula SHA-256 da senha via `sha256()` utility
  - Envia `{ type: 'auth_request', username, passwordHash }`
  - Aguarda `auth_response` com timeout de 10s
  - Se status `ok`: armazena `authToken` e `sessionUser`, retorna dados
  - Se status `error`: rejeita com mensagem de erro
  - Timeout: rejeita com "Timeout de autenticação"
- [x] 3.3 Modificar `connect()` para não fazer handshake automático:
  - `connect()` apenas estabelece WebSocket e aguarda `onopen`
  - `authenticate()` é chamado separadamente após `connect()`
  - `doConnect()` resolve promise no `onopen` (sem handshake)
- [x] 3.4 Método `getToken()` público para acesso externo ao token
- [x] 3.5 Método `isAuthenticated()` público
- [x] 3.6 `sync()` inclui `token: this.authToken` em toda mensagem

## 4. Handlers — incluir token nas requisições

- [x] 4.1 `pullCatalog()` em `pull-handler.ts`:
  - Token incluído automaticamente pelo adapter.sync() (task 3.6)
- [x] 4.2 `sendSale()` em `sale-handler.ts`:
  - Token incluído automaticamente pelo adapter.sync() (task 3.6)

## 5. SyncManager — novo fluxo syncAll com autenticação

- [x] 5.1 Modificar `initialize()` — não conectar automaticamente:
  - `initialize()` só registra callback e carrega settings
  - Conexão é feita separadamente via `adapter.connect()`
- [x] 5.2 Adicionar método `connectAndAuth(username, password)`:
  - `adapter.connect()`
  - `adapter.authenticate(username, password)`
  - Retorna `{ token, user, encryptionSalt }`
- [x] 5.3 Modificar `syncAll()`:
  - Remover pull de `users` e `roles` (não sincronizar mais)
  - Continuar pull de `products`, `clients`, `tags`, `suppliers`
  - Token é incluído automaticamente pelo adapter.sync()

## 6. UI — sync-initial com formulário de credenciais

- [x] 6.1 Redesenhar `sync-initial.tsx`:
  - Estado inicial: formulário com campos `username` e `password`
  - Ao submit: `discovering` → `connecting` → `authenticating` → `syncing` → `success`
  - Se auth falhar: exibir erro "Credenciais inválidas"
  - Se conexão falhar: exibir erro atual
- [x] 6.2 Após auth + sync bem-sucedido:
  - Chama `AuthService.createSessionFromUser(user, token)` para auto-login
  - Navega para `/(tabs)` ou `/(tabs)/sales` baseado em permissões
  - Não passa mais pela tela de login
- [x] 6.3 Adicionar step `authenticating` ao tipo `SyncStep`

## 7. App routing — ajustes de fluxo

- [x] 7.1 `index.tsx`:
  - Roteamento já está correto (session → tabs, hasUsers → login, else → sync-initial)
  - sync-initial agora cria sessão, então auto-login flui para tabs

## 8. Verificação

- [x] 8.1 Executar `pnpm check` (tsc) — zero erros de TypeScript
- [x] 8.2 Executar `pnpm lint` — zero erros de lint
- [x] 8.3 Executar `pnpm test` — testes existentes continuam passando (53/53)
