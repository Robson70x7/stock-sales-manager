## ADDED Requirements

### Requirement: Tela sync-initial com formulário de credenciais

A tela de primeira sincronização DEVE exibir campos para username e senha antes de iniciar a conexão.

#### Scenario: Primeiro acesso mostra formulário

- **WHEN** o usuário acessa `sync-initial` pela primeira vez (sem sessão ativa, sem usuários no banco)
- **THEN** a tela MUST exibir campos de `username` e `password`
- **AND** MUST exibir botão "Conectar e Sincronizar"
- **AND** MUST NÃO iniciar conexão automaticamente

#### Scenario: Submit com credenciais

- **WHEN** o usuário preenche username e senha
- **AND** pressiona "Conectar e Sincronizar"
- **THEN** o app MUST:
  1. Descobrir desktop na rede (`discovering`)
  2. Conectar WebSocket (`connecting`)
  3. Autenticar com username + senha (`authenticating`)
  4. Sincronizar catálogo (`syncing`)
  5. Auto-login e navegar para tela principal (`success`)

#### Scenario: Falha de autenticação

- **WHEN** as credenciais são inválidas
- **THEN** o app MUST exibir mensagem de erro "Credenciais inválidas"
- **AND** MUST manter o formulário preenchido para o usuário corrigir
- **AND** MUST NÃO navegar para outra tela

### Requirement: Auto-login após sync bem-sucedido

Após autenticação e sincronização bem-sucedidas, o app DEVE fazer login automático.

#### Scenario: Auto-login

- **WHEN** `authenticate()` retorna sucesso com user data
- **AND** `syncAll()` completa com sucesso
- **THEN** o app MUST chamar `AuthService.createSessionFromUser(user, token)`
- **AND** MUST navegar para `/(tabs)` ou `/(tabs)/sales` (baseado em permissões)
- **AND** MUST NÃO redirecionar para a tela de login

### Requirement: Estados de progresso

A tela DEVE mostrar o progresso do fluxo com indicadores visuais.

#### Scenario: Indicador de progresso

- **WHEN** o fluxo está em andamento
- **THEN** o app MUST mostrar o passo atual: `descobrindo desktop...` → `conectando...` → `autenticando...` → `sincronizando...` → `concluído`
- **AND** MUST exibir `ActivityIndicator` durante o processo
- **AND** MUST desabilitar o botão de submit durante a execução
