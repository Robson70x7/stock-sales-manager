# VendaFácil — TODO

## Configuração e Estrutura
- [x] Configurar tema de cores (azul corporativo)
- [x] Configurar navegação por abas (5 tabs)
- [x] Criar estrutura de dados e tipos TypeScript
- [x] Criar contexto global de dados com AsyncStorage
- [x] Mapear ícones no icon-symbol.tsx
- [x] Gerar logo e configurar branding

## CRUD de Produtos
- [x] Tela de lista de produtos com busca
- [x] Formulário de criação/edição de produto
- [x] Deletar produto com confirmação
- [x] Vinculação de tags a produtos
- [x] Controle de estoque (quantidade)

## CRUD de Clientes
- [x] Tela de lista de clientes com busca
- [x] Formulário de criação/edição de cliente
- [x] Deletar cliente com confirmação
- [x] Vinculação de tags a clientes
- [x] Histórico de compras do cliente

## CRUD de Vendas
- [x] Tela de lista de vendas com filtros
- [x] Formulário de criação/edição de venda
- [x] Seleção de cliente na venda
- [x] Adição de produtos à venda
- [x] Controle de tipo de pagamento (dinheiro, cartão, pix, crédito)
- [x] Suporte a vendas parceladas (número de parcelas, datas)
- [x] Controle de status de parcelas (pago/pendente)
- [x] Deletar venda com confirmação
- [x] Vinculação de tags a vendas
- [x] Filtro por período, cliente, tipo de pagamento, status

## Sistema de Tags
- [x] Tela de lista de tags
- [x] Formulário de criação/edição de tag (nome, cor)
- [x] Deletar tag com confirmação
- [x] Tela de detalhe de tag com todos os itens vinculados
- [x] Componente TagChip reutilizável
- [x] Seletor de tags em formulários
- [x] Limpeza automática de tagIds ao excluir uma tag

## Tela de Resumo Mensal
- [x] Cabeçalho com mês/ano atual
- [x] Navegação por setas entre meses (< >)
- [x] Cards de totais (a receber, recebido, saldo)
- [x] Lista de operações do mês (vendas e parcelas)
- [x] Barra de pesquisa com filtro em tempo real
- [x] Pesquisa integrada com tags (busca por nome de tag)
- [x] Chips de tags como atalhos de filtro rápido

## Relatórios
- [x] Tela de relatórios com seletor de período
- [x] Balanço: receita total, recebido, pendente, cancelado
- [x] Fluxo de caixa mensal com gráfico de barras
- [x] Filtros por tipo de pagamento, cliente, tags
- [ ] Exportar/compartilhar relatório (futuro)

## Polimento
- [x] Feedback háptico nas ações principais
- [x] Estados vazios (empty states) em todas as listas
- [x] Confirmações de exclusão
- [x] Formatação de moeda (BRL)
- [x] Suporte a dark mode
- [x] Testes unitários (39 testes passando)

## Melhorias Solicitadas (v1.1)
- [x] Permitir parcelas em todas as modalidades de pagamento (dinheiro, PIX, débito, transferência, crédito)
- [x] Exibir mês/ano (MM/YY) no título da tela de Resumo entre as setas de navegação


## Melhorias Solicitadas (v1.2)
- [x] Adicionar data picker com calendário pt-br em todos os campos de data
- [x] Campo de data da primeira parcela (separado da data de cadastro da venda)
- [x] Remover campo "título" da venda e usar nome do produto como campo computado
- [x] Adicionar interface de seleção de tags em vendas e clientes (já implementada)
- [x] Implementar filtro por período e navegação por mês na tela de vendas
- [x] Implementar débito automático de estoque ao criar venda
- [x] Adicionar opção de criar cliente direto na tela de vendas (modal inline)
- [x] Implementar histórico de alterações para marcação de parcelas pagas


## Correções (v1.3)
- [x] Corrigir backgrounds brancos em modais e componentes para tema escuro
- [x] Corrigir problema de data com 1 dia atrasado (timezone/UTC)
- [x] Adicionar validação de estoque (não permitir quantidade maior que disponível)
- [x] Mudar formato de datas no título para mês abreviado (Jan 2026, Fev 2026, etc)


## Correções e Melhorias (v1.5)
- [x] Adicionar campo de foto ao produto com upload via image picker
- [x] Renderizar fotos na listagem de produtos
- [x] Tornar cards de Recebido/A Receber clicáveis para filtrar operações
- [x] Adicionar diálogo de devolução de estoque ao excluir venda
- [x] Adicionar opção "não perguntar novamente" com salvamento em configurações
- [x] Criar tela de Configurações para gerenciar preferências do app
