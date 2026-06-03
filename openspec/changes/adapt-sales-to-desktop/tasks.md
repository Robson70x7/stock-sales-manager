## 1. Database Migrations

- [x] 1.1 Create migration v7: add `averageCost` to products, create `product_tags` and `client_tags` junction tables
- [x] 1.2 Create migration v8: add `website`, `pix`, `address` to suppliers
- [x] 1.3 Create migration v9: add `uuid` column to sale_items, populate with UUIDs, migrate PK
- [x] 1.4 Create migration v10: add `costAtSale`, `profitAmount`, `status` columns to sale_items
- [x] 1.5 Create migration v11: add `type` column to installments
- [x] 1.6 Update `LATEST_VERSION` in `lib/database/schema.ts` and migration registry

## 2. Shared Types Alignment

- [x] 2.1 Add `averageCost` field to `Product` type in `shared/types/index.ts`
- [x] 2.2 Add `tagIds` field to `Product` and `Client` types
- [x] 2.3 Add `Supplier` type with `website`, `pix`, `address` fields
- [x] 2.4 Add `id`, `costAtSale`, `profitAmount`, `status` fields to `SaleItem` type
- [x] 2.5 Add `type` field to `Installment` type
- [x] 2.6 Add `SaleItemStatus` type (`'active' | 'cancelled'`) and `InstallmentType` type (`'normal' | 'entry'`)

## 3. Database Helpers (db.ts)

- [x] 3.1 Add `product_tags` CRUD helpers: `getProductTags(productId)`, `setProductTags(productId, tagIds[])`, `deleteProductTags(productId)`
- [x] 3.2 Add `client_tags` CRUD helpers: `getClientTags(clientId)`, `setClientTags(clientId, tagIds[])`, `deleteClientTags(clientId)`
- [x] 3.3 Update `DbProduct`, `saveProduct`, `mergeProducts` to include `averageCost`
- [x] 3.4 Update `DbSaleItem`, `saveSaleItem` to include `costAtSale`, `profitAmount`, `status`
- [x] 3.5 Update `DbInstallment`, `saveInstallment` to include `type`
- [x] 3.6 Update `mergeProducts` to handle `averageCost` and `tagIds` (with product_tags sync)
- [x] 3.7 Update `mergeClients` to handle `tagIds` (with client_tags sync)
- [x] 3.8 Added `DbStockMovement.unitCost`/`totalCost` and updated `saveStockMovement`
- [x] 3.9 Add `getProductStockWithCost` helper that returns stock + averageCost
- [x] 3.10 Add `updateAverageCost(productId)` helper that recalculates weighted average
- [x] 3.11 Add suppliers CRUD (`getSuppliers`, `getSupplierById`, `saveSupplier`, `deleteSupplier`, `mergeSuppliers`)

## 4. AverageCost Calculation

- [x] 4.1 Implement weighted average cost calculation in `addStockMovement` (entrada paths calls `updateAverageCost`)
- [x] 4.2 Update `DbStockMovement` and `saveStockMovement` to carry `unitCost`/`totalCost`
- [x] 4.3 Add `updateAverageCost` helper to recalculate weighted average from stock movements

## 5. Sale Creation Flow

- [x] 5.1 Sale items now get UUID via `item.id || generateId()` in `toDbSaleItem`
- [x] 5.2 `addSale` calculates `costAtSale` and `profitAmount` per item using `getProductStockWithCost`
- [x] 5.3 Add `type: 'entry'` to installments (done in `generateInstallmentsWithEntry` via `utils.ts`)
- [x] 5.4 Add `type: 'normal'` to installments (done in `generateInstallments` via `utils.ts`)
- [x] 5.5 Stock movements in `addSale` now include `unitCost` and `totalCost`
- [x] 5.6 `addSale` saves sale_items with UUID, costAtSale, profitAmount, status

## 6. Context/State Updates

- [x] 6.1 `toDbProduct`/`fromDbProduct` include `averageCost`
- [x] 6.2 `fromDbSale` includes `costAtSale`, `profitAmount`, `status` on items, `type` on installments
- [x] 6.3 `toDbSaleItem`/`toDbInstallment` include all new fields
- [x] 6.4 `loadAllData` loads product_tags and client_tags relationships

## 7. UI Updates

- [x] 7.1 Update product detail screen to show `averageCost`, margin %, and tags
- [x] 7.2 Update client detail screen to show tags (data loaded via `tagIds`)
- [x] 7.3 Supplier UI not created (out of scope - mobile is read-only for cadastros per spec)
- [x] 7.4 Update sale detail screen to show `costAtSale` and `profitAmount` per item
- [x] 7.5 Update `generateInstallments`/`generateInstallmentsWithEntry` to include `type` field

## 8. Sync Pull Catalog Update

- [x] 8.1 `applyPullResult` delegates to `mergeProducts` which now handles `tagIds` and `averageCost`
- [x] 8.2 `applyPullResult` delegates to `mergeClients` which now handles `tagIds`
- [x] 8.3 `mergeProducts` now stores `averageCost` from desktop data
- [x] 8.4 `applyPullResult` now has `suppliers` case, delegates to `mergeSuppliers`
- [x] 8.5 `mergeProducts` clears and repopulates `product_tags` from `tagIds`
- [x] 8.6 `mergeClients` clears and repopulates `client_tags` from `tagIds`
- [x] 8.7 `syncAll` in `sync-manager.ts` now pulls `suppliers` entity too

## 9. Sync Sale Ingestion Update

- [x] 9.1 `sendSale` passes the full sale object which now includes `costAtSale`, `profitAmount`, `status`
- [x] 9.2 `sendSale` passes installments with `type` field
- [x] 9.3 `Sale` type already includes all new fields via shared types

## 10. Data Integrity & Cleanup

- [x] 10.1 Run `pnpm check` (tsc) — passou sem erros
- [x] 10.2 Run `pnpm test` — 53/53 testes passaram
- [x] 10.3 Compiled and verified all type changes, fixed all type errors
