# AGENTS.md

## Tech Stack
- Expo SDK 54 + React Native 0.81.5 + React 19
- Metro bundler with NativeWind v4 (Tailwind for RN)
- React Query v5 for data fetching
- expo-sqlite (SQLite3) with raw SQL (no ORM)
- pnpm 9.12 (hoisted linker, see `.npmrc`)

## Commands
- `pnpm dev` — concurrent server + Metro (`pnpm dev:server` + `pnpm dev:metro`)
- `pnpm dev:server` — **not implemented** (references missing `server/_core/index.ts`)
- `pnpm dev:metro` — Expo web on port `${EXPO_PORT:-8081}`
- `pnpm build` — esbuild server to `dist/` (ESM format, external packages)
- `pnpm start` — production server from `dist/index.js`
- `pnpm check` — TypeScript (`tsc --noEmit`)
- `pnpm lint` — ESLint (expo lint)
- `pnpm test` — Vitest (run mode, not watch)
- `pnpm migrations:generate` — generate DB migrations via `tsx scripts/generate-migrations.ts`

## Architecture
- **App entry**: `app/_layout.tsx` (Expo Router file-based routing)
- **API calls**: `lib/_core/api.ts` (fetch-based, no tRPC)
- **Database**: `lib/database/db.ts` with raw SQL helpers; schema in `lib/database/schema.ts`
- **Migrations**: SQL files in `lib/database/migrations/`, generated via `pnpm migrations:generate`
- **Shared types**: `shared/types.ts` and `shared/types/index.ts` (path alias `@shared/*`)
- **Sync system**: `shared/sync/` — P2P local sync via mDNS + WebSocket (see `SYNC_ARCHITECTURE.md`)
- **Auth**: `lib/_core/auth.ts` (SecureStore on native, cookies on web)

## Path Aliases
- `@/*` → root `./`
- `@shared/*` → `./shared/*`

## Key Configuration Facts
- **Env loading**: `app.config.ts` imports `scripts/load-env.js` before anything else (runs at config time)
- **Env mapping**: system vars (`VITE_APP_ID`, `OAUTH_SERVER_URL`, etc.) mapped to `EXPO_PUBLIC_*` in `scripts/load-env.js`
- **Metro + NativeWind**: `metro.config.js` uses `withNativeWind` with `forceWriteFileSystem: true` (fixes iOS styling in dev)
- **Babel**: preset `babel-preset-expo` with `jsxImportSource: "nativewind"`, plus `react-native-worklets/plugin`
- **Tailwind**: dark mode via `class` strategy (`data-theme="dark"`), custom `light:` / `dark:` variants defined in `tailwind.config.js`
- **Expo new arch**: enabled (`newArchEnabled: true` in `app.config.ts`)
- **React Compiler**: enabled (`experiments.reactCompiler: true`)

## What NOT to Edit
Files under `_core/` directories are framework-level scaffolding — extend via sibling files:
- `lib/_core/` — do not edit; extend via files in `lib/` or `shared/lib/`
- `shared/_core/` — do not edit; extend via files in `shared/`

## Database
- SQLite3
- Lazy connection in `lib/database/db.ts` (`getDb()` always returns a db instance, never null)
- Do not use `INSERT OR REPLACE`; verify existence, remove existing, then save new item (convention not yet enforced in code)
- Always use UUID format for ids.

## Testing
- Vitest config in `package.json` (`vitest` devDependency)
- Test files in `tests/` (e.g., `tests/auth.logout.test.ts`)
- No watch mode by default (`pnpm test` = `vitest run`)

## Environment Variables
- Expo public (client): must use `EXPO_PUBLIC_` prefix (e.g., `EXPO_PUBLIC_APP_ID`, `EXPO_PUBLIC_API_BASE_URL`)
- Loaded at runtime by `scripts/load-env.js` (imported by `app.config.ts`)

## Build Artifacts
- `dist/` — esbuild output (gitignored)
- `.expo/` — Expo cache (gitignored)
