# Design do Aplicativo — Gestão de Estoque e Vendas

## Identidade Visual

- **Nome do App:** VendaFácil
- **Paleta de Cores:**
  - Primary: `#2563EB` (azul corporativo)
  - Success: `#16A34A` (verde para receitas/vendas)
  - Warning: `#D97706` (amarelo para alertas/parcelas pendentes)
  - Error: `#DC2626` (vermelho para inadimplência/cancelamentos)
  - Background Light: `#F8FAFC`
  - Background Dark: `#0F172A`
  - Surface Light: `#FFFFFF`
  - Surface Dark: `#1E293B`
  - Foreground Light: `#0F172A`
  - Foreground Dark: `#F1F5F9`
  - Muted Light: `#64748B`
  - Muted Dark: `#94A3B8`
  - Border Light: `#E2E8F0`
  - Border Dark: `#334155`

## Telas do Aplicativo

### 1. Resumo (Home) — Tab Principal
- **Conteúdo:** Cabeçalho com mês atual, saldo do mês, total a receber, total recebido
- **Navegação por Slide:** Swipe horizontal para navegar entre meses (passado/futuro)
- **Lista de Operações:** FlatList com cards de vendas/parcelas do mês selecionado
- **Barra de Pesquisa:** Campo de busca no topo que filtra por título, descrição e tags
- **Chips de Tags:** Linha horizontal de tags como atalhos de filtro rápido
- **Indicador de Mês:** Dots ou setas para indicar navegação entre meses

### 2. Vendas — Tab
- **Lista de Vendas:** FlatList com cards mostrando cliente, valor, status, data
- **Filtros:** Barra de filtros por período, cliente, tipo de pagamento, status
- **FAB:** Botão flutuante para adicionar nova venda
- **Card de Venda:** Nome do cliente, valor total, parcelas pagas/total, status colorido

### 3. Produtos — Tab
- **Lista de Produtos:** FlatList com cards mostrando nome, estoque, preço
- **Busca:** Campo de pesquisa no topo
- **FAB:** Botão flutuante para adicionar novo produto
- **Card de Produto:** Nome, categoria, preço de custo/venda, quantidade em estoque, status

### 4. Clientes — Tab
- **Lista de Clientes:** FlatList com avatar inicial, nome, telefone, total de compras
- **Busca:** Campo de pesquisa
- **FAB:** Botão flutuante para adicionar novo cliente
- **Card de Cliente:** Inicial do nome, nome completo, contato, tags associadas

### 5. Relatórios — Tab
- **Seletor de Período:** Picker de data inicial e final
- **Balanço:** Card com receita total, despesas, lucro líquido
- **Fluxo de Caixa:** Gráfico de barras mensal (usando react-native-svg)
- **Filtros:** Por tipo de pagamento, cliente, tags
- **Exportação:** Botão para compartilhar relatório

### 6. Tags — Tela Modal/Stack
- **Lista de Tags:** FlatList com nome, cor, quantidade de itens vinculados
- **FAB:** Botão para criar nova tag
- **Detalhe de Tag:** Ao tocar, abre lista de todos os itens vinculados (vendas, clientes, produtos)

## Telas de Detalhe/Formulário

### Formulário de Venda
- Campos: Cliente (picker), Produtos (lista selecionável), Valor total, Tipo de pagamento
- Parcelas: Toggle para parcelado, número de parcelas, datas de vencimento
- Tags: Seletor de tags existentes
- Observações: Campo de texto livre

### Formulário de Produto
- Campos: Nome, Categoria, Descrição, Preço de custo, Preço de venda, Quantidade em estoque
- Tags: Seletor de tags
- Imagem: Opcional (placeholder com ícone)

### Formulário de Cliente
- Campos: Nome completo, CPF/CNPJ (opcional), Telefone, Email, Endereço
- Tags: Seletor de tags (ex: "inadimplente", "vip", "atacado")
- Histórico: Lista de compras do cliente

### Formulário de Tag
- Campos: Nome, Cor (seletor de cores predefinidas), Ícone (opcional)

## Fluxos Principais

### Fluxo de Nova Venda
1. Tab Vendas → FAB "+" → Formulário de Venda
2. Selecionar cliente → Adicionar produtos → Definir pagamento
3. Se parcelado: definir nº de parcelas → datas automáticas
4. Adicionar tags → Salvar
5. Retorna à lista de vendas com nova venda no topo

### Fluxo de Pesquisa no Resumo
1. Tela Resumo → Tocar na barra de pesquisa
2. Digitar "inadimplente" → App busca em títulos, descrições e tags
3. Resultados filtrados aparecem na lista
4. Tocar em chip de tag → filtra apenas por aquela tag

### Fluxo de Navegação Mensal
1. Tela Resumo → Swipe horizontal ou tocar setas
2. Mês muda com animação suave
3. Lista e totais atualizam para o mês selecionado
4. Indicador visual mostra mês atual vs navegado

## Componentes Reutilizáveis

- `MoneyText`: Formata valores em BRL (R$ 1.234,56)
- `StatusBadge`: Badge colorido para status (pago, pendente, cancelado, parcial)
- `TagChip`: Chip colorido com nome da tag
- `SaleCard`: Card de venda com informações resumidas
- `ProductCard`: Card de produto com estoque
- `ClientCard`: Card de cliente com avatar
- `FilterBar`: Barra de filtros horizontais scrollável
- `EmptyState`: Tela de estado vazio com ícone e mensagem
- `FAB`: Botão de ação flutuante
- `MonthNavigator`: Componente de navegação entre meses com swipe
