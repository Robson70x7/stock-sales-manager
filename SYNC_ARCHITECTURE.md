# Arquitetura de Sincronização - VendaFácil

## Visão Geral

O sistema de sincronização foi projetado para ser **extensível e modular**, permitindo múltiplas estratégias de sincronização:

- **P2P Local** (atual) - Sincronização entre dispositivos na mesma rede
- **Backend** (futuro) - Sincronização via servidor central
- **Híbrida** (futuro) - Combina P2P local com sincronização em nuvem
- **QR Code** (futuro) - Sincronização via QR code + servidor

## Componentes Principais

### 1. **SyncAdapter** (Interface Base)

Localização: `shared/sync/sync-adapter.ts`

Toda estratégia de sincronização deve implementar esta interface:

```typescript
interface SyncAdapter {
  name: SyncStrategy;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sync(data: any): Promise<any>;
  onMessage(callback: (message: SyncMessage) => void): void;
  getDevices(): Promise<SyncDevice[]>;
}
```

### 2. **LocalP2PSyncAdapter** (Implementação Atual)

Localização: `shared/sync/adapters/local-p2p.ts`

Sincroniza dados entre dispositivos na mesma rede usando:
- **mDNS** para descoberta de dispositivos
- **WebSocket** para comunicação em tempo real
- **Timestamp-based conflict resolution** para resolver conflitos

### 3. **SyncManager** (Orquestrador Central)

Localização: `shared/sync/sync-manager.ts`

Coordena o adaptador e gerencia:
- Estado de sincronização
- Detecção de conflitos
- Callbacks de mudança de estado

### 4. **DeviceDiscoveryService** (Descoberta)

Localização: `shared/sync/device-discovery.ts`

Encontra e rastreia dispositivos na rede local.

### 5. **ConflictResolver** (Resolução de Conflitos)

Localização: `shared/sync/conflict-resolver.ts`

Resolve conflitos usando estratégias:
- **Timestamp-based**: Última edição vence
- **Merge**: Mescla campos que não conflitam
- **Manual**: Usuário escolhe qual versão manter

## Fluxo de Sincronização

```
┌─────────────────────────────────────────────────┐
│ Usuário clica "Iniciar Sincronização"           │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────▼────────────┐
         │ SyncManager.sync() │
         └───────┬────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ Adapter.connect()            │
         │ - Iniciar servidor           │
         │ - Descobrir dispositivos     │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ Adapter.sync(data)           │
         │ - Enviar dados               │
         │ - Receber dados remotos      │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ ConflictResolver.detect()    │
         │ - Detectar conflitos         │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ Se há conflitos:             │
         │ - Notificar usuário          │
         │ - Aguardar resolução         │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ Aplicar mudanças             │
         │ - Atualizar dados locais     │
         └───────┬──────────────────────┘
                 │
         ┌───────▼──────────────────────┐
         │ Notificar conclusão          │
         │ - Atualizar UI               │
         └──────────────────────────────┘
```

## Estrutura de Pastas

```
shared/
├── sync/
│   ├── types.ts                    # Interfaces e tipos
│   ├── sync-adapter.ts             # Classe base abstrata
│   ├── sync-manager.ts             # Orquestrador
│   ├── device-discovery.ts         # Descoberta de dispositivos
│   ├── conflict-resolver.ts        # Resolução de conflitos
│   ├── adapters/
│   │   ├── local-p2p.ts           # P2P Local (atual)
│   │   ├── backend.ts             # Backend (futuro)
│   │   ├── hybrid.ts              # Híbrida (futuro)
│   │   └── qr-code.ts             # QR Code (futuro)
│   └── index.ts                    # Exportações
├── context/                        # Contexto compartilhado
├── lib/                            # Utilitários
├── hooks/
│   └── use-sync.ts                # Hook de sincronização
└── types/                          # Tipos compartilhados
```

## Como Adicionar um Novo Adaptador

### 1. Criar arquivo do adaptador

```typescript
// shared/sync/adapters/backend.ts
import { BaseSyncAdapter } from '../sync-adapter';
import { SyncStrategy } from '../types';

export class BackendSyncAdapter extends BaseSyncAdapter {
  name: SyncStrategy = 'backend';

  async connect(): Promise<void> {
    // Implementar conexão com servidor
  }

  async disconnect(): Promise<void> {
    // Implementar desconexão
  }

  async sync(data: any): Promise<any> {
    // Implementar sincronização
  }

  async getDevices() {
    // Retornar dispositivos do servidor
  }
}
```

### 2. Exportar no index

```typescript
// shared/sync/index.ts
export { BackendSyncAdapter } from './adapters/backend';
```

### 3. Usar no app

```typescript
const adapter = new BackendSyncAdapter(deviceId);
await syncManager.initialize(adapter);
```

## Tipos de Dados

### SyncMessage

```typescript
interface SyncMessage {
  type: 'sync-request' | 'sync-response' | 'sync-update' | 'conflict' | 'heartbeat';
  deviceId: string;
  timestamp: number;
  data?: any;
  conflictId?: string;
}
```

### SyncDevice

```typescript
interface SyncDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  ip?: string;
  port?: number;
  lastSeen: number;
}
```

### SyncConflict

```typescript
interface SyncConflict {
  id: string;
  type: 'product' | 'sale' | 'client';
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
  resolution?: 'local' | 'remote' | 'merge';
}
```

## Estratégias de Resolução de Conflitos

### 1. Timestamp-based (Padrão)

Última edição vence. Cada item deve ter um campo `updatedAt`.

```typescript
const resolution = resolver.resolve(conflict);
// Retorna: 'local' | 'remote' | 'merge'
```

### 2. Merge Automático

Mescla campos que não conflitam.

```typescript
const merged = resolver.merge(local, remote);
```

### 3. Manual

Usuário escolhe qual versão manter.

```typescript
syncManager.resolveConflict(conflictId, 'local'); // ou 'remote'
```

## Integração com AppContext

O contexto compartilhado deve ser atualizado quando sincronização completa:

```typescript
// Em AppContext
useEffect(() => {
  syncManager.onStateChange((state) => {
    if (state.status === 'connected' && state.conflicts.length === 0) {
      // Recarregar dados
      loadDataFromStorage();
    }
  });
}, []);
```

## Testes

Testes para cada adaptador devem cobrir:

- ✅ Conexão e desconexão
- ✅ Sincronização de dados
- ✅ Detecção de conflitos
- ✅ Resolução de conflitos
- ✅ Descoberta de dispositivos
- ✅ Tratamento de erros

## Próximas Fases

1. **Fase 3** ✅ - Implementar sincronização P2P (COMPLETO)
2. **Fase 4** - Criar UI de sincronização
3. **Fase 5** - Configurar builds separados
4. **Fase 6** - Testar sincronização em rede real
5. **Fase 7** - Entregar versão inicial

## Notas Importantes

- A sincronização é **assíncrona** e não bloqueia a UI
- Conflitos são **detectados automaticamente**
- O usuário pode **escolher qual versão manter**
- A arquitetura permite **múltiplas estratégias** sem mudanças no código existente
- Cada adaptador é **independente** e pode ser testado isoladamente
