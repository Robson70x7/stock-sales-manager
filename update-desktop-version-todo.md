# Plano de Atualização - Mobile para Desktop Version

Este documento lista as melhorias a serem implementadas nas telas do projeto mobile para alinhar com a versão desktop.

## Legenda
- [ ] Pendente
- [✓] Concluído
- [~] Em progresso

---

## 1. Tela de Vendas (Sales)

### 1.1 Lista de Vendas (`app/(tabs)/sales.tsx`)
- [ ] Adicionar cards de resumo no topo do mês (TotalReceitas, TotalRecebido, Pendente)
- [ ] Adicionar stats rápidos (quantidade de vendas, valor médio)
- [ ] Adicionar ordenação (data, valor, cliente)
- [ ] Adicionar pull-to-refresh
- [ ] Melhorar visual dos filtros ativos

### 1.2 Nova Venda (`app/sales/new.tsx`)
- [ ] Adicionar campo de busca/favoritos produtos no picker
- [ ] Adicionar scanner de código de barras para adicionar produto rápido
- [ ] Permitir edit individual dos valores de cada parcela
- [ ] Adicionar opção "salvar e criar outra"

### 1.3 Detalhe da Venda (`app/sales/[id].tsx`)
- [ ] Adicionar botão de compartilhar/gerar recibo
- [ ] Adicionar histórico de alterações da venda
- [ ] Exibir mais detalhes das parcelas (histórico de pagamentos)

### 1.4 Editar Venda (`app/sales/edit/[id].tsx`)
- [ ] Adicionar capacidade de editar itens (adicionar/remover/quantidade)
- [ ] Adicionar capacidade de editar desconto
- [ ] Adicionar capacidade de editar parcelas (quantidade e valores)
- [ ] Adicionar capacidade de editar data da primeira parcela

---

## 2. Tela de Produtos (Products)

### 2.1 Lista de Produtos (`app/(tabs)/products.tsx`)
- [ ] Adicionar filtro por categoria
- [ ] Adicionar filtro por nível de estoque (esgotado, baixo, normal)
- [ ] Adicionar ordenação (nome, preço, estoque, data)
- [ ] Adicionar ajuste rápido de estoque (botão + / - nos cards)
- [ ] Melhorar exibição do nível de estoque com cores mais distintas

### 2.2 Novo Produto (`app/products/new.tsx`)
- [ ] Adicionar campo SKU/Código de barras
- [ ] Adicionar campo de estoque mínimo (alerta)
- [ ] Adicionar campo de fornecedor
- [ ] Adicionar histórico de custo (salvar alterações de custo)

### 2.3 Detalhe do Produto (`app/products/[id].tsx`)
- [ ] Adicionar histórico de vendas deste produto
- [ ] Adicionar histórico de movimento de estoque
- [ ] Adicionar valor total em estoque (custo * quantidade)
- [ ] Adicionar histórico de preço de custo

### 2.4 Editar Produto (`app/products/edit/[id].tsx`)
- [ ] Mesmos campos do novo produto
- [ ] Adicionar lógica para detectar mudança de custo e salvar histórico

---

## 3. Tela de Tags

### 3.1 Lista de Tags (`app/(tabs)/tags.tsx`)
- [ ] Adicionar busca de tags
- [ ] Usar as 8 cores predefinidas do desktop (mais distintas)
- [ ] Adicionar funcionalidade de mesclar tags
- [ ] Adicionar atribuição em massa de tags

### 3.2 Detalhe da Tag (`app/tags/[id].tsx`)
- [ ] Adicionar opção para adicionar novos itens vinculados
- [ ] Adicionar opção para remover itens da tag
- [ ] Adicionar opção para editar a tag
- [ ] Adicionar busca dentro de cada seção

---

## 4. Tela de Clientes (Clients)

### 4.1 Lista de Clientes (`app/(tabs)/clients.tsx`)
- [ ] Adicionar filtro por tags
- [ ] Adicionar ordenação (nome, última compra, total gasto)
- [ ] Adicionar ações rápidas (ligar, WhatsApp, email)

### 4.2 Novo Cliente (`app/clients/new.tsx`)
- [ ] Adicionar campos de endereço estendidos (rua, número, cidade, estado, CEP)
- [ ] Adicionar campo de data de aniversário
- [ ] Adicionar campo de limite de crédito
- [ ] Adicionar campo de método de pagamento preferido

### 4.3 Detalhe do Cliente (`app/clients/[id].tsx`)
- [ ] Exibir histórico completo de compras
- [ ] Adicionar média de compras
- [ ] Adicionar frequência de compras
- [ ] Adicionar histórico de pagamentos pendentes
- [ ] Adicionar ações rápidas de contato

---

## 5. Tela de Relatórios (Reports)

### 5.1 Relatórios (`app/(tabs)/reports.tsx`)
- [ ] Adicionar relatório por produto (receita por produto)
- [ ] Adicionar relatório por cliente (receita por cliente)
- [ ] Adicionar relatório por categoria
- [ ] Adicionar relatório de lucro/margem
- [ ] Adicionar comparação com períodos anteriores
- [ ] Adicionar exportação para PDF/Excel

---

## 6. Melhorias Gerais

### UI/UX
- [ ] Adicionar toggle dark/light mode
- [ ] Adicionar indicador de modo offline
- [ ] Adicionar feedback visual para operações de sync

### Componentes Reutilizáveis
- [ ] Criar componente de CurrencyInput para valores monetários
- [ ] Melhorar componente de DatePicker
- [ ] Adicionar componentes de gráfico melhorados

### Banco de Dados
- [ ] Verificar se schema suporta todas as novas funcionalidades
- [ ] Adicionar migrations necessárias

---

## Prioridade de Implementação

### Alta Prioridade (MVP)
1. Sales - Resumo mensal e stats rápidos
2. Products - Filtros e ordenação
3. Products - Campos SKU e estoque mínimo
4. Tags - Cores distintas e busca

### Média Prioridade
5. Sales - Edição completa de vendas
6. Clients - Endereço e ações rápidas
7. Products - Histórico de custo e vendas

### Baixa Prioridade
8. Reports - Relatórios avançados
9. Exportação PDF/Excel
10. Comparação de períodos

---

## Notas

- Manter layout stacked para lista de produtos
- Usar componentes existentes do projeto
- Manter esquema de cores globais
- Banco de dados já está configurado com Drizzle (MySQL/TiDB no backend, AsyncStorage no mobile)