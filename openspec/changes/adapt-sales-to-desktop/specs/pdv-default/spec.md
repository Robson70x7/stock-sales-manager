## ADDED Requirements

### Requirement: Produtos exibem dados completos do desktop

O sistema MUST exibir todos os campos do produto sincronizados do desktop, incluindo `averageCost` e tags vinculadas.

#### Scenario: Produto com averageCost exibido

- **WHEN** o usuário visualiza o detalhe de um produto
- **THEN** o campo "Custo Médio" MUST ser exibido com o valor de `averageCost`
- **AND** "Margem" MUST ser calculada como `((salePrice - averageCost) / salePrice) * 100`
- **AND** MUST exibir badge "Sincronizado do Desktop"

#### Scenario: Produto com tags exibidas

- **WHEN** o usuário visualiza o detalhe de um produto
- **AND** o produto possui tags vinculadas via `product_tags`
- **THEN** as tags DEVEM ser exibidas como chips coloridos abaixo dos dados do produto

### Requirement: Clientes exibem tags vinculadas

O sistema MUST exibir as tags vinculadas aos clientes via `client_tags`.

#### Scenario: Cliente com tags

- **WHEN** o usuário visualiza o detalhe de um cliente
- **AND** o cliente possui tags vinculadas via `client_tags`
- **THEN** as tags DEVEM ser exibidas como chips coloridos na seção de informações

## MODIFIED Requirements

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

### Requirement: Exibir warnings de estoque nas vendas

O sistema MUST exibir warnings de estoque recebidos do desktop após envio de venda.

#### Scenario: Venda com over-sell

- **WHEN** o desktop aceita venda com warnings de estoque negativo
- **THEN** o sistema MUST exibir um alerta para o usuário com os produtos em over-sell
- **AND** MUST armazenar os warnings no detalhe da venda
- **AND** MUST exibir indicador visual na tela de detalhes da venda
- **AND** a tela de detalhes MUST exibir também `costAtSale` e `profitAmount` para cada item

### Requirement: Indicador visual de dados sincronizados

O sistema MUST exibir indicadores visuais para informar o usuário sobre a origem dos dados.

#### Scenario: Produto sincronizado do desktop

- **WHEN** um produto foi obtido via sync do desktop
- **THEN** a tela de detalhes do produto MUST exibir badge "Sincronizado do Desktop"
- **AND** campos de edição DEVEM estar desabilitados
- **AND** as tags vinculadas via `product_tags` DEVEM ser exibidas

#### Scenario: Primeiro sync (app vazio)

- **WHEN** o usuário abre o app pela primeira vez
- **AND** nenhum sync foi realizado ainda
- **THEN** as listas de produtos, clientes e tags DEVEM exibir EmptyState com mensagem "Conecte ao desktop para sincronizar dados"
