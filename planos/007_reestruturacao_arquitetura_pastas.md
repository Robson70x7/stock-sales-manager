# 007 — Reestruturação de Arquitetura de Pastas

Reorganizar a estrutura de diretórios do projeto seguindo Clean Architecture, movendo os arquivos recém-criados e existentes para `src/`.

---

## Estrutura Alvo

```
src/
  domain/           ← shared/domain/ (entidades puras)
    entities/
    value-objects/
  application/      ← shared/application/ (ports + services)
    ports/
    services/
  presentation/     ← app/ + hooks/ + components/ (React/Expo)
    app/            ← app/ (Expo Router)
    hooks/          ← hooks/
    components/     ← components/
  infra/            ← lib/database/ (banco, repositórios concretos)
    database/
      repositories/ ← lib/database/repositories/
      db.ts         ← lib/database/db.ts
      schema.ts     ← lib/database/schema.ts
      utils.ts      ← lib/database/utils.ts
      migrations/   ← lib/database/migrations/
  shared/           ← shared/ + lib/ (helpers, tipos, _core, sync)
```

---

## Dicionário de Movimentação

| Atual | Novo | Observação |
|---|---|---|
| `shared/domain/` | `src/domain/` | Entidades puras |
| `shared/application/` | `src/application/` | Ports + Services |
| `app/` | `src/presentation/app/` | Expo Router — precisa configurar `appDir` |
| `hooks/` | `src/presentation/hooks/` | |
| `components/` | `src/presentation/components/` | |
| `lib/database/` | `src/infra/database/` | Infraestrutura |
| `shared/types.ts` | `src/shared/types.ts` | |
| `shared/const.ts` | `src/shared/const.ts` | |
| `shared/lib/` | `src/shared/lib/` | Helpers compartilhados |
| `shared/_core/` | `src/shared/_core/` | |
| `shared/sync/` | `src/shared/sync/` | |
| `shared/hooks/` | `src/shared/hooks/` | |
| `lib/utils.ts` | `src/shared/lib/utils.ts` | Utilitários gerais |
| `lib/query-client.ts` | `src/shared/lib/query-client.ts` | |
| `types/` | `src/shared/types/` (ou removido) | Barrel |

---

## Fases

### Fase 1 — Criar estrutura e mover arquivos (com `git mv` para preservar histórico)

```bash
# Criar diretórios alvo
mkdir -p src/domain src/application src/presentation src/infra/database src/shared

# Domain
git mv shared/domain/entities src/domain/
git mv shared/domain/value-objects src/domain/

# Application
git mv shared/application/ports src/application/
git mv shared/application/services src/application/

# Presentation
git mv app/ src/presentation/app/
git mv hooks/ src/presentation/hooks/
git mv components/ src/presentation/components/

# Infra
git mv lib/database/db.ts src/infra/database/
git mv lib/database/schema.ts src/infra/database/
git mv lib/database/utils.ts src/infra/database/
git mv lib/database/repositories src/infra/database/
git mv lib/database/migrations src/infra/database/

# Shared (mesclar shared/ + lib/ em src/shared/)
git mv shared/* src/shared/
git mv lib/utils.ts src/shared/lib/utils.ts
git mv lib/query-client.ts src/shared/lib/query-client.ts

# Remover diretórios antigos vazios
rm -rf shared/ lib/ types/
```

### Fase 2 — Atualizar path aliases (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/presentation/*"],
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infra/*": ["./src/infra/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### Fase 3 — Configurar Expo Router para `src/presentation/app/`

No `app.config.ts`, ajustar o `appDir`:

```ts
// SDK 54 — verificar propriedade exata
{
  expo: {
    platforms: {
      appDir: "./src/presentation/app"
    }
  }
}
```

**⚠️ Pendência**: Confirmar no Expo SDK 54 a propriedade correta para definir diretório `app/` customizado.

### Fase 4 — Atualizar imports em todo o código

Script automatizado (exemplo com `tsx` + glob + regex):

| Padrão antigo | Novo padrão |
|---|---|
| `@/lib/database/` | `@infra/database/` |
| `@/hooks/` | `@/hooks/` (se `@/*` = `src/presentation/*`, continua igual) |
| `@/components/` | `@/components/` (idem) |
| `@/types` | `@shared/types` |
| `@/shared/domain/` | `@domain/` |
| `@/shared/application/` | `@application/` |
| `@/shared/` | `@shared/` |
| `@/lib/utils` | `@shared/lib/utils` |
| `@/lib/query-client` | `@shared/lib/query-client` |
| `@/app/` | `@/app/` (se `@/*` = `src/presentation/*`, continua igual) |

### Fase 5 — Verificar

```bash
pnpm check     # tsc --noEmit
pnpm lint      # eslint
pnpm test      # vitest
```

Verificar também se o Metro bundler consegue fazer bundle com o novo `appDir`.

---

## Pendências

1. **Expo Router `appDir`** — Confirmar propriedade no SDK 54 para diretório `app/` customizado
2. **Escopo do alias `@/*`** — Definir se continua apontando para `src/presentation/` (só telas/hooks/components) ou se muda
3. **`types/` barrel** — Manter em `src/shared/types/` ou fundir em `src/shared/types.ts`?
4. **NativeWind/Tailwind** — Verificar se `tailwind.config.js` ou `metro.config.js` têm referências a paths antigos
