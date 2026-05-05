# AGENTS.md

## Tech Stack
- Expo SDK 54 + React Native 0.81.5 + React 19
- Metro bundler with NativeWind v4 (Tailwind for RN)
- Express backend with tRPC v11 + React Query v5
- Drizzle ORM (MySQL/TiDB) with drizzle-kit migrations
- pnpm 9.12 (hoisted linker, see `.npmrc`)

## Commands
- `pnpm dev` — concurrent server + Metro (`pnpm dev:server` + `pnpm dev:metro`)
- `pnpm dev:server` — Express backend via `tsx watch` (uses `server/_core/index.ts`)
- `pnpm dev:metro` — Expo web on port `${EXPO_PORT:-8081}`
- `pnpm build` — esbuild server to `dist/` (ESM format, external packages)
- `pnpm start` — production server from `dist/index.js`
- `pnpm check` — TypeScript (`tsc --noEmit`)
- `pnpm lint` — ESLint (expo config)
- `pnpm test` — Vitest (run mode, not watch)
- `pnpm db:push` — `drizzle-kit generate && drizzle-kit migrate`

## Architecture
- **App entry**: `app/_layout.tsx` (Expo Router file-based routing)
- **Backend entry**: `server/_core/index.ts` (Express + tRPC, don't edit `_core/`)
- **tRPC routers**: add to `server/routers.ts` (use `protectedProcedure` / `publicProcedure` from `./_core/trpc`)
- **Database schema**: `drizzle/schema.ts` → migrations auto-generated in `drizzle/migrations/`
- **Shared types**: `shared/` (path alias `@shared/*` in tsconfig)
- **Sync system**: `shared/sync/` — P2P local sync via mDNS + WebSocket (see `SYNC_ARCHITECTURE.md`)

## Path Aliases
- `@/*` → root `./`
- `@shared/*` → `./shared/*`

## Key Configuration Facts
- **Env loading**: `app.config.ts` imports `scripts/load-env.js` before anything else (runs at config time)
- **Metro + NativeWind**: `metro.config.js` uses `withNativeWind` with `forceWriteFileSystem: true` (fixes iOS styling in dev)
- **Babel**: preset `babel-preset-expo` with `jsxImportSource: "nativewind"`, plus `react-native-worklets/plugin`
- **Tailwind**: dark mode via `class` strategy (`data-theme="dark"`), custom `light:` / `dark:` variants defined in `tailwind.config.js`
- **Expo new arch**: enabled (`newArchEnabled: true` in `app.config.ts`)
- **React Compiler**: enabled (`experiments.reactCompiler: true`)

## What NOT to Edit
Files under any `_core/` directory are framework-level scaffolding — extend via the sibling files:
- `server/routers.ts` (not `server/_core/`)
- `server/db.ts` (not `server/_core/`)
- `lib/trpc.ts` (not `lib/_core/`)
- `shared/types.ts` / `shared/const.ts` (not `shared/_core/`)

## Auth
- Manus OAuth: cookies on web, SecureStore on native
- `hooks/use-auth.ts` — don't modify (framework hook)
- Protect tRPC routes with `protectedProcedure`; handle `UNAUTHORIZED` errors in frontend

## Database
- MySQL dialect (`drizzle.config.ts` — requires `DATABASE_URL` env var)
- Lazy connection in `server/db.ts` (`getDb()` returns null if DB unavailable)
- Push schema changes: `pnpm db:push`

## Testing
- Vitest config in `package.json` (`vitest` devDependency)
- Test files in `tests/` (e.g., `tests/auth.logout.test.ts`)
- No watch mode by default (`pnpm test` = `vitest run`)

## Environment Variables
- Server-side: `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`
- Expo public (client): must use `EXPO_PUBLIC_` prefix (e.g., `EXPO_PUBLIC_APP_ID`, `EXPO_PUBLIC_API_BASE_URL`)
- Loaded at runtime by `scripts/load-env.js` (imported by `app.config.ts`)

## Build Artifacts
- `dist/` — esbuild output (gitignored)
- `.expo/` — Expo cache (gitignored)
- `drizzle/migrations/` — auto-generated (committed)
