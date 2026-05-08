# VendaFácil — TODO

## 1. Mudanças no Schema (SQLite)
- Criar tabela `stock_movements`: `id` (UUID), `productId` (FK), `quantity` (INT), `type` (TEXT), `createdAt` (ISO8601).
- Adicionar coluna `isDeleted` (BOOLEAN DEFAULT 0) em todas as tabelas (Soft Delete).
- Usar a tabela `settings` para armazenar a chave `last_sync_timestamp`.

Vamos alterar o formato de controle de estoque, não sera mais por numero fixo no product, mas sim movimentos transacionais.
Cada venda altera o stock_movemnts e cada nova compra um insert no stock_movents.

Vamos altear na interface para este novo modelo de controle do estoque. Mais eficiente melhor controle com sistema distribuido e sem perda real do valor do estoque original.


## 2. Valor de entrada na venda

- Vamos implementar uma funcionalidade de entrada na venda, onde o usuario pode informar um valor de entrada na venda e o restante do valor segue no formato padrão.
Vamos seguir com o formato de installmetns onde a entrada é uma installment dedicada com o formtao de valor de entrada.

_Validações_:
* Valor de entrada não pode ser maior que o valor da compra.
* Se entrada for igual o valor da compra considerar como valor de venda normal e não como entrada. Noticar o usuário da alteração.


