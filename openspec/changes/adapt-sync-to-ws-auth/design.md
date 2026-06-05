## Context

O desktop implementou autenticação obrigatória no WebSocket: todo cliente deve enviar `auth_request` com username + SHA-256(senha) antes de realizar qualquer operação. O servidor responde com JWT + salt de criptografia + dados do usuário. Mensagens subsequentes (`pull`, `sale`) devem incluir o JWT. O handshake antigo (`handshake`/`handshake_ack`) não é mais reconhecido.

O mobile precisa se adaptar a esse novo protocolo. Além disso, vamos otimizar o fluxo de primeira sincronização: em vez de trazer todos os usuários, autenticar no WebSocket e persistir apenas o usuário autenticado.

### Diagrama de Sequência — Novo Fluxo

```
                       sync-initial.tsx
                             |
              [Usuário preenche username + senha]
                             |
              DeviceDiscoveryService.runOnce()
                             |
              LocalP2PSyncAdapter.connect()
                             |
              ws://desktop:9999  ──── CONNECT ──────►  Desktop
                             |
              auth_request ──── { type:"auth_request",       ──────►  Desktop
              |                  username, passwordHash }    
              |                                              [valida bcrypt]
              |                                              [gera JWT + salt]
              |                                              [busca user data]
              |                 ◄──── auth_response ────────
              |           { type:"auth_response",
              |             status:"ok",
              |             token:"<jwt>",
              |             encryptionSalt:"<hex>",
              |             user:{id,name,username,roleName,permissions}}
              |
              [Salva user no SQLite local]
              [Cria sessão ativa (auto-login)]
              |
              pull ──────────── { type:"pull", entity:"products",   ──────►  Desktop
              |                  token:"<jwt>" }
              |                 ◄──── pull_result ─────────────────
              |            { type:"pull_result", entity:"products",
              |              data:[...], token:"<jwt>" }
              |
              [Repete para clients, tags, suppliers]
              |
              [Router.replace('/(tabs)') — auto-login]
```

## Goals / Non-Goals

**Goals:**
- Mobile se autentica no WebSocket antes de qualquer operação
- sync-initial pede credenciais e faz auth + sync + auto-login em sequência
- Apenas o usuário autenticado é salvo localmente (não sync de todos os users)
- JWT é incluído em todas as mensagens pull/sale
- Handshake antigo é removido
- Login tradicional continua funcionando para sessões já estabelecidas

**Non-Goals:**
- Criptografia E2EE dos payloads (será feita em change futuro)
- Suporte a múltiplos usuários no mobile (apenas o autenticado)
- Reautenticação automática em caso de token expirado (JWT 24h, aceitável)
- Sync bidirecional de usuários (usuários são gerenciados apenas no desktop)

## Decisions

### 1. Autenticação substitui handshake, não convive
**Decisão**: O adapter não envia mais `handshake`. A primeira mensagem após conexão é `auth_request`. Se o servidor rejeitar, a conexão é fechada com erro.
**Motivo**: Servidor desktop não aceita mais handshake simples. Não há compatibilidade retroativa.
**Alternativa**: Tentar handshake antigo primeiro, fallback para auth — rejeitado porque o servidor rejeita imediatamente.

### 2. passwordHash é SHA-256 da senha
**Decisão**: O mobile calcula `SHA-256(password)` e envia como `passwordHash`. O servidor faz `bcrypt.compare(passwordHash, storedHash)`.
**Motivo**: Não enviar senha em texto puro. O desktop espera esse formato (definido no spec `ws-auth`).
**Segurança**: Tráfego em rede local — risco aceitável. E2EE virá em change futuro.

### 3. Auto-login após sync-initial bem-sucedido
**Decisão**: Após receber `auth_response` com user data, o mobile salva o usuário no SQLite e cria sessão ativa automaticamente — o usuário não passa pela tela de login.
**Motivo**: O usuário já digitou as credenciais no sync-initial. Seria redundante pedir novamente.
**Fluxo**: sync-initial → auth → sync → `router.replace('/(tabs)')`

### 4. Token armazenado na instância do adapter (não no banco)
**Decisão**: O JWT é mantido em memória no `LocalP2PSyncAdapter`, não persistido. Em nova conexão, novo auth_request é necessário.
**Motivo**: JWT é válido por 24h mas associado à sessão WebSocket. Se desconectar, nova conexão exige reautenticação.
**Alternativa**: Persistir token no banco — rejeitado porque o servidor não aceita token de sessão anterior sem nova conexão.

### 5. Não sincronizar users/papéis — apenas o usuário autenticado
**Decisão**: `syncAll()` não faz mais pull de `users` nem `roles`. O user autenticado vem no `auth_response` (com `roleName` e `permissions[]`). Papéis e permissões são embutidos no objeto do usuário.
**Motivo**: O fluxo anterior sincronizava todos os usuários para o mobile para permitir login local — agora o login é feito contra o desktop via WebSocket. Só precisamos do user logado.
**Impacto**: `mergeUsers` e `mergeRoles` continuam existindo para compatibilidade mas não são chamados no fluxo normal.

### 6. AuthService ganha método `createSessionFromUser`
**Decisão**: Novo método que recebe o user object do `auth_response` e cria sessão ativa + salva o usuário no banco, sem passar pelo `AuthService.login()` (que faz bcrypt local).
**Motivo**: O user veio autenticado pelo desktop — não precisamos verificar senha novamente.

## Risks / Trade-offs

- **[Token expirado durante uso]** Se o token expirar (24h) enquanto o app está aberto, as próximas requisições falharão → Aceitável: app fecha/reconecta em novo uso diário
- **[Falha de auth no sync-initial]** Se credenciais forem inválidas, usuário vê erro e pode tentar novamente → Tratamento normal de erro
- **[Perda do user logado]** Se o banco for limpo, app volta para sync-initial → Fluxo normal de primeiro uso
- **[Compatibilidade com desktop antigo]** Desktop sem auth rejeita conexão → Aceitável: desktop precisa estar atualizado
