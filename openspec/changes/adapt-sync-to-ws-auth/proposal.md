## Why

O desktop agora exige autenticação em todas as conexões WebSocket, conforme implementado no change `sync-auth-encryption`. O handshake simples (troca de `deviceId`) não é mais aceito — toda conexão deve passar por `auth_request` com username + senha, receber um JWT, e incluir esse token em todas as mensagens subsequentes.

O fluxo atual do mobile:
1. Sincroniza **todos os usuários** (com passwordHash) para o banco local
2. Usuário faz login localmente via `AuthService.login()` com bcrypt
3. Não há autenticação no WebSocket — handshake apenas identifica o dispositivo

Isso não funciona mais com o novo protocolo do desktop. Além disso, sincronizar todos os usuários com hashes de senha para o mobile é um risco de segurança desnecessário — só precisamos do usuário que está se autenticando.

## What Changes

**Novo fluxo de primeira sincronização:**
- **Antes**: sync-initial > syncAll() (traz todos os usuários) > login local > app
- **Depois**: sync-initial (com formulário de credenciais) > conecta WebSocket > auth_request com username+senha > desktop autentica e retorna user + JWT > salva apenas o usuário autenticado > auto-login > app

### Mudanças no protocolo WebSocket
- **Remover** handshake antigo (`{ type: 'handshake', version, deviceId }`)
- **Adicionar** auth flow: o adapter envia `auth_request` com `{ username, passwordHash }`
- **Gerenciar JWT**: armazenar token na sessão do adapter, incluir em toda mensagem `pull`, `sale`
- **Remover** sync de `users` (não trazer todos os usuários) — apenas o usuário autenticado é persistido

### Mudanças na UI
- **sync-initial.tsx**: adicionar campos de username + senha antes de conectar
- Após auth bem-sucedida, fazer sync dos dados de catálogo (products, clients, tags, suppliers) e auto-login
- **login.tsx**: manter para usuários que já têm dados locais (reconexão posterior)

### Mudanças no SyncManager
- `syncAll()` agora recebe `{ token, userId }` para filtrar dados do usuário específico
- Não sincroniza mais `users` — o usuário autenticado vem na resposta do `auth_response`
- `pullCatalog` inclui `token` no payload

## Capabilities

### Modified Capabilities
- `ws-auth-flow`: Adapter WebSocket agora faz autenticação via auth_request/JWT em vez de handshake simples
- `sync-auth-protocol`: Mensagens do protocolo incluem token JWT; usuários não são mais sincronizados em massa
- `sync-initial-auth`: Tela de primeira sincronização agora pede credenciais e faz auto-login após auth

## Impact

- `src/shared/sync/types.ts`: novos tipos de mensagem (`auth_request`, `auth_response`, `token` field)
- `src/shared/sync/adapters/local-p2p.ts`: substituir handshake por auth flow, gerenciar token/sessão
- `src/shared/sync/sync-manager.ts`: `syncAll()` recebe token, não sincroniza users
- `src/shared/sync/handlers/pull-handler.ts`: incluir token nas requisições
- `src/shared/sync/handlers/sale-handler.ts`: incluir token nas requisições
- `src/presentation/app/(auth)/sync-initial.tsx`: novo layout com formulário de credenciais + auto-login
- `src/presentation/app/index.tsx`: lógica de redirect pode precisar de ajustes
- `src/shared/lib/auth-service.ts`: novo método para criar sessão direta a partir de user do auth_response
- `src/shared/hooks/use-auth.ts`: suporte a auto-login via sync
