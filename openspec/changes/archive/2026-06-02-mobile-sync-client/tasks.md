## 1. Dependencies & Setup

- [x] 1.1 Add `react-native-zeroconf` to package.json
- [x] 1.2 Run `pnpm install` to install new dependency
- [x] 1.3 Add the plugin config for react-native-zeroconf to `app.config.ts` (if needed for Expo)

## 2. Extend Sync Types for Desktop Protocol

- [x] 2.1 Add new message types to `shared/sync/types.ts`: `handshake`, `handshake_ack`, `pull`, `pull_result`, `sale`, `ack`
- [x] 2.2 Add `DesktopSyncMessage` type with fields for `entity`, `since`, `data`, `timestamp`, `status`, `warnings`
- [x] 2.3 Add `SaleSyncStatus` type (`pending | synced | failed`) and `syncStatus` field to Sale type in `shared/types/index.ts`
- [x] 2.4 Update `SyncState` to include `desktopDeviceId`, `lastSyncTimestamp`

## 3. Implement Device Discovery (mDNS Client)

- [x] 3.1 Implement `DeviceDiscoveryService.start()` in `shared/sync/device-discovery.ts` using `react-native-zeroconf`
- [x] 3.2 Add callback for device found / device lost events
- [x] 3.3 Add manual IP entry fallback method
- [x] 3.4 Add service type configuration (`_vendafacil._tcp.local.`)
- [x] 3.5 Export the service from `shared/sync/index.ts`

## 4. Implement WebSocket Sync Adapter (Desktop Client)

- [x] 4.1 Rewrite `LocalP2PSyncAdapter` in `shared/sync/adapters/local-p2p.ts` as a WebSocket client that connects to the desktop
- [x] 4.2 Implement `connect()`: connect WebSocket to `ws://<desktop-ip>:9999`
- [x] 4.3 Implement handshake: send `{ type: "handshake", version: "1.0", deviceId }` on connect
- [x] 4.4 Implement `disconnect()`: close WebSocket, cleanup
- [x] 4.5 Implement message routing: parse incoming JSON, emit via `emitMessage()`
- [x] 4.6 Implement auto-reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
- [x] 4.7 Implement `getDevices()`: return discovered desktop from DeviceDiscoveryService
- [x] 4.8 Export updated adapter from `shared/sync/index.ts`

## 5. Implement Pull Catalog Handler

- [x] 5.1 Create `shared/sync/handlers/pull-handler.ts` with functions for pull, merge, and apply
- [x] 5.2 Implement `pullCatalog(entity, since?)`: send pull message via WebSocket
- [x] 5.3 Implement `applyPullResult(entity, data, timestamp)`: merge received data into local SQLite
- [x] 5.4 Implement merge logic: replace existing records by ID with desktop data, mark local-only records as kept, apply deletes
- [x] 5.5 Add database helper `mergeProducts(data)` in `lib/database/db.ts`
- [x] 5.6 Add database helper `mergeClients(data)` in `lib/database/db.ts`
- [x] 5.7 Add database helper `mergeTags(data)` in `lib/database/db.ts`
- [x] 5.8 Save `lastSyncTimestamp` after successful pull

## 6. Implement Sale Ingestion Handler

- [x] 6.1 Create `shared/sync/handlers/sale-handler.ts` with functions for send and process ack
- [x] 6.2 Implement `sendSale(sale)`: serialize and send sale via WebSocket
- [x] 6.3 Implement `processAck(message)`: update sale sync status based on ack response
- [x] 6.4 Add `syncStatus` column to `sales` table via new migration (v6)
- [x] 6.5 Add `syncError` and `syncWarnings` columns to `sales` table
- [x] 6.6 Update `lib/database/db.ts` functions to handle syncStatus field

## 7. Update SyncManager for Desktop Protocol

- [x] 7.1 Add `syncAll()` method to SyncManager: orchestrates pull catalog + push pending sales
- [x] 7.2 Add `getPendingSales()` helper to query sales with `syncStatus != 'synced'`
- [x] 7.3 Persist and restore `lastSyncTimestamp` per entity using settings store
- [x] 7.4 Add state changes for pull progress and sale send progress

## 8. Create Sync Settings UI

- [x] 8.1 Add sync section to `app/(tabs)/settings.tsx` with status indicator, device list, connect/disconnect button
- [x] 8.2 Create sync connection status bar component (`components/sync/SyncStatusBar.tsx`)
- [x] 8.3 Implement "Sincronizar Agora" button that triggers `syncAll()`
- [x] 8.4 Update `components/sync/SyncButton.tsx` to reflect desktop sync status
- [x] 8.5 Add manual desktop IP input fallback in settings

## 9. Implement PDV Default UI (Always PDV)

- [x] 9.1 Remove "Novo Produto" / "Editar" buttons from `app/(tabs)/products.tsx` and `app/products/[id].tsx`
- [x] 9.2 Remove "Novo Cliente" / "Editar" buttons from `app/(tabs)/clients.tsx` and `app/clients/[id].tsx`
- [x] 9.3 Remove "Nova Tag" / "Editar" buttons from tags screens
- [x] 9.4 Show "Gerenciar no Desktop" message on product/client/tag detail pages
- [x] 9.5 Show persistent "Modo Offline" banner when no desktop connection
- [x] 9.6 Show "Conectado ao Desktop" badge when connected
- [x] 9.7 Show sync status badge on sale list items with `syncStatus != 'synced'`
- [x] 9.8 Show over-sell warnings on sale detail view when present
- [x] 9.9 Add EmptyState with "Conecte ao desktop para sincronizar dados" for empty product/client/tag lists

## 10. Verification & Polish

- [x] 10.1 Run `pnpm run check` (TypeScript) — fix all type errors
- [x] 10.2 Run `pnpm run lint` — fix all lint errors
- [x] 10.3 Remove unused imports from `app/(tabs)/settings.tsx`
- [x] 10.4 Remove unused imports from `app/(tabs)/tags.tsx`
- [x] 10.5 Remove unused imports from `app/(tabs)/clients.tsx`
- [x] 10.6 Remove unused imports from `app/(tabs)/products.tsx`
- [x] 10.7 Remove unused imports from `app/clients/[id].tsx`
- [x] 10.8 Remove unused imports from `app/products/[id].tsx`
- [x] 10.9 Run `pnpm run test` — ensure existing tests pass
- [ ] 10.10 Manual verification: start desktop SyncServer, connect mobile, verify handshake
- [ ] 10.11 Manual verification: pull products/clients/tags from desktop, verify data in mobile
- [ ] 10.12 Manual verification: create sale on mobile, sync, verify sale appears on desktop
- [ ] 10.13 Manual verification: no create/edit buttons for products/clients/tags, offline banner shows when disconnected
- [ ] 10.14 Document known limitations and future improvements
