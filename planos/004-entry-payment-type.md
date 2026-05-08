# Adicionar `entryPaymentType` — Tipo de Pagamento da Entrada

Permite que a entrada (down payment) tenha um tipo de pagamento diferente do restante da venda. Ex: venda parcelada no cartão de crédito com entrada em PIX ou Dinheiro.

## Arquivos a modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `lib/database/migrations/005_entry_payment_type.sql` | `ALTER TABLE sales ADD COLUMN entryPaymentType TEXT` |
| 2 | `shared/types/index.ts` | Adicionar `entryPaymentType?: PaymentType` em `Sale` |
| 3 | `lib/database/db.ts` | Adicionar `entryPaymentType` em `DbSale` e nos SQLs de `saveSale` |
| 4 | `context/AppContext.tsx` | Mapear `entryPaymentType` em `toDbSale` / `fromDbSale` |
| 5 | `app/sales/new.tsx` | Exibir seletor de tipo de pagamento da entrada quando `entryAmount > 0` |
| 6 | `app/sales/[id].tsx` | Exibir tipo de pagamento da entrada: `Entrada (PIX)` |
| 7 | `app/sales/edit/[id].tsx` | Exibir `entryPaymentType` como read-only |
| 8 | `app/(tabs)/sales.tsx` | Exibir label "Entrada" com info do payment type |

## Detalhamento

### 1. Migration `005_entry_payment_type.sql`
```sql
ALTER TABLE sales ADD COLUMN entryPaymentType TEXT;
```

### 2. `shared/types/index.ts`
```ts
export interface Sale {
  // ...existing fields
  entryAmount?: number;
  entryPaymentType?: PaymentType;
  // ...rest
}
```

### 3. `lib/database/db.ts`
- `DbSale`: adicionar `entryPaymentType: string | null`
- `saveSale` INSERT: incluir `entryPaymentType` nos VALUES
- `saveSale` UPDATE: incluir `entryPaymentType` no SET

### 4. `context/AppContext.tsx`
- `toDbSale`: `entryPaymentType: sale.entryPaymentType || null`
- `fromDbSale`: `entryPaymentType: row.entryPaymentType as PaymentType || undefined`

### 5. `app/sales/new.tsx`
- Estado: `const [entryPaymentType, setEntryPaymentType] = useState<PaymentType>(paymentType);`
- Sincronizar com `paymentType` quando `entryAmount` é zero
- Quando `entryAmount > 0`, renderizar chips de tipo de pagamento abaixo do campo "Valor de Entrada" com título "Tipo de Entrada"
- Passar `entryPaymentType` no `addSale`

### 6. `app/sales/[id].tsx`
- Substituir `'Entrada'` por `` `Entrada (${getPaymentTypeLabel(sale.entryPaymentType || sale.paymentType)})` ``

### 7. `app/sales/edit/[id].tsx`
- Exibir `entryPaymentType` como read-only (texto, não seletor)

### 8. `app/(tabs)/sales.tsx`
- No SummaryItem da entrada, exibir `Entrada · PIX` no lugar de só `Entrada`

## Ordem de implementação

```
1 (migration SQL) → pnpm migrations:generate
→ 2 (types) → 3 (db.ts) → 4 (AppContext)
→ 5 (sales/new.tsx) → 6 (sales/[id].tsx) → 7 (edit) → 8 (list)
```
