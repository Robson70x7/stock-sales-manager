## Why

O mobile (VendaFacil) e o desktop (Electron) são sistemas independentes com bancos SQLite separados sem comunicação entre si. O mobile precisa atuar como PDV de balcão, consultando dados mestres do desktop e enviando vendas criadas localmente para o desktop, sem depender de nuvem ou internet. O protocolo de sincronização já foi definido e implementado no lado do desktop; falta o cliente de sincronização no mobile.

## What Changes

- **Sync Client** — novo módulo no mobile que se conecta ao SyncServer do desktop via WebSocket
- **Device Discovery** — cliente mDNS para descobrir automaticamente o desktop na rede local
- **Pull Catalog** — recebimento de dados mestres (produtos, clientes, tags) do desktop, com suporte a sync completo e incremental
- **Sale Ingestion** — envio de vendas criadas no mobile para o desktop, com tratamento de respostas (ack, warnings, erros)
- **PDV Default** — mobile é sempre PDV: cadastros são read-only (gerenciados no desktop), criação de vendas offline permitida, sync automático quando desktop disponível
- **Sync Settings UI** — tela de configuração de sync com status, dispositivos encontrados, e gatilho manual de sincronização

## Capabilities

### New Capabilities
- `sync-client`: Cliente WebSocket que se conecta ao SyncServer do desktop, gerencia ciclo de vida da conexão, reconexão, e roteamento de mensagens
- `sync-device-discovery`: Descoberta de dispositivos desktop na LAN via mDNS, exibição na UI de configuração
- `sync-pull-catalog`: Recebimento e aplicação local dos dados mestres (produtos, clientes, tags) vindos do desktop, com merge de atualizações
- `sync-sale-ingestion`: Envio de vendas criadas no mobile para o desktop, tratamento de ack/erros/warnings, reconciliação de status
- `pdv-default`: Mobile opera sempre como PDV — cadastros são read-only (fonte: desktop), vendas são criadas offline ou online, sync gerencia merge de dados mestres e ingestão de vendas

### Modified Capabilities
<!-- Nenhuma capability existente está sendo modificada em nível de requisitos -->

## Impact

- `shared/sync/`: Adaptadores existentes (local-p2p) serão substituídos ou estendidos para usar o novo protocolo
- `app/(tabs)/settings.tsx`: Nova seção de configurações de sync com status, descoberta, botão de sincronizar
- `app/(tabs)/products.tsx`, `app/products/new.tsx`, `app/products/edit/`: Botões de criar/editar removidos (mobile é PDV, cadastros vêm do desktop)
- `app/(tabs)/clients.tsx`, `app/clients/new.tsx`, `app/clients/edit/`: Mesmo tratamento — cadastros são read-only
- `lib/database/db.ts`: Novas funções para merge de dados sincronizados
- `package.json`: Novas dependências (`ws`, `multicast-dns` ou equivalente para React Native)
- `app/sales/new.tsx`: Adaptação para exibir warnings de estoque vindos do desktop
