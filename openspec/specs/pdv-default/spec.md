## ADDED Requirements

### Requirement: Cadastros são read-only

O sistema MUST NÃO permitir criação ou edição de produtos, clientes e tags. O desktop é a fonte da verdade para dados mestres.

#### Scenario: Usuário tenta acessar criar produto

- **WHEN** o usuário navega para a tela de produtos
- **THEN** a lista de produtos MUST ser exibida
- **AND** o botão "Novo Produto" MUST NÃO estar presente
- **AND** a tela de detalhes do produto MUST NÃO exibir opções de edição

#### Scenario: Usuário tenta acessar criar cliente

- **WHEN** o usuário navega para a tela de clientes
- **THEN** a lista de clientes MUST ser exibida
- **AND** o botão "Novo Cliente" MUST NÃO estar presente
- **AND** a tela de detalhes do cliente MUST NÃO exibir opções de edição

#### Scenario: Usuário tenta criar tag

- **WHEN** o usuário navega para a tela de tags
- **THEN** a lista de tags MUST ser exibida
- **AND** o botão "Nova Tag" MUST NÃO estar presente

### Requirement: Operação offline para vendas

O sistema MUST permitir criação de vendas mesmo sem conexão com o desktop.

#### Scenario: Venda criada sem desktop disponível

- **WHEN** o usuário cria uma venda
- **AND** não há conexão com o desktop
- **THEN** a venda MUST ser salva localmente com `syncStatus = "pending"`
- **AND** a venda MUST estar visível na lista de vendas
- **AND** MUST exibir badge "Aguardando sync"

#### Scenario: Desktop fica disponível após venda offline

- **WHEN** o desktop é detectado na rede
- **AND** existem vendas com `syncStatus = "pending"`
- **THEN** o sistema MUST enviar as vendas pendentes para o desktop
- **AND** MUST atualizar o status de sync conforme ack recebido

### Requirement: Indicador de estado offline

O sistema MUST exibir indicador persistente quando não há conexão com o desktop.

#### Scenario: Sem desktop na rede

- **WHEN** não há desktop detectado na rede local
- **THEN** o sistema MUST exibir um banner ou badge persistente "Modo Offline"
- **AND** MUST exibir "Conecte ao desktop para gerenciar cadastros" na área de produtos/clientes/tags

#### Scenario: Desktop conectado

- **WHEN** a conexão WebSocket com o desktop está ativa
- **THEN** o sistema MUST exibir badge "Conectado ao Desktop"
- **AND** dados de cadastros são exibidos normalmente

### Requirement: Exibir warnings de estoque nas vendas

O sistema MUST exibir warnings de estoque recebidos do desktop após envio de venda.

#### Scenario: Venda com over-sell

- **WHEN** o desktop aceita venda com warnings de estoque negativo
- **THEN** o sistema MUST exibir um alerta para o usuário com os produtos em over-sell
- **AND** MUST armazenar os warnings no detalhe da venda
- **AND** MUST exibir indicador visual na tela de detalhes da venda

### Requirement: Indicador visual de dados sincronizados

O sistema MUST exibir indicadores visuais para informar o usuário sobre a origem dos dados.

#### Scenario: Produto sincronizado do desktop

- **WHEN** um produto foi obtido via sync do desktop
- **THEN** a tela de detalhes do produto MUST exibir badge "Sincronizado do Desktop"
- **AND** campos de edição DEVEM estar desabilitados

#### Scenario: Primeiro sync (app vazio)

- **WHEN** o usuário abre o app pela primeira vez
- **AND** nenhum sync foi realizado ainda
- **THEN** as listas de produtos, clientes e tags DEVEM exibir EmptyState com mensagem "Conecte ao desktop para sincronizar dados"
