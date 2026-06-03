## Context

O mobile (React Native/Expo) atualmente opera como sistema independente com banco SQLite local. O desktop (Electron/CQRS) evoluiu com agregações extraídas, audit trail e dezenas de handlers. Ambos precisam sincronizar via rede local.

O lado **desktop** do sync já foi implementado (SyncServer na porta 9999, mDNS como `_vendafacil._tcp`, handlers de pull e sale ingestion). Falta o **cliente mobile** que descobre o desktop, conecta via WebSocket, puxa dados mestres e envia vendas.

A arquitetura de sync existente em `shared/sync/` fornece a estrutura base (SyncManager, adapters, conflict resolver, device discovery), mas os adapters são stubs. Esta mudança implementa os adapters concretos para o protocolo definido pelo desktop.

## Goals / Non-Goals

**Goals:**
- Cliente WebSocket que se conecta ao SyncServer do desktop na porta 9999
- Descoberta automática do desktop via mDNS na rede local
- Handshake com troca de deviceId e versão
- Pull de catálogo (produtos, clientes, tags) com suporte a full dump e incremental por timestamp
- Aplicação local dos dados recebidos (merge com dados existentes, respeitando soft delete)
- Envio de vendas criadas no mobile para o desktop com tratamento de ack/success/warnings/errors
- Adaptação da UI para modo PDV (desktop é fonte da verdade para cadastros)
- UI de configuração de sync com status, dispositivos encontrados e gatilho manual

**Non-Goals:**
- Sincronia bidirecional de catálogo (mobile não envia produtos/clientes/tags para o desktop)
- Sincronia de relatórios ou configurações
- Criptografia das mensagens
- Suporte a múltiplos desktops simultâneos
- Sync automático em background (será manual/trigger por enquanto)
- Reconciliação de vendas já existentes em ambos os lados

## Decisions

| Decisão | Alternativas | Motivo |
|---------|-------------|--------|
| **WebSocket nativo do React Native** em vez de `ws` package | `ws` (Node.js), `react-native-websocket` | React Native já tem WebSocket global nativo, sem dependência extra |
| **react-native-zeroconf** para mDNS | multicast-dns (Node), react-native-udp + dns-sd | `react-native-zeroconf` é a lib madura para mDNS/Bonjour em React Native. Expo dev client suporta |
| **SyncManager existente como orquestrador** | Novo módulo separado | Reusa a arquitetura em `shared/sync/` (SyncManager, estados, eventos). O novo `LocalP2PSyncAdapter` concreto substitui o stub |
| **Merge simples (desktop vence)** para catálogo | Merge por campo, three-way merge | Desktop é fonte da verdade para cadastros. Mobile apenas substitui registros locais pelos dados do desktop |
| **Timestamp como cursor de sync** | UUID de evento | Mesma escolha do desktop. `updatedAt` já existe em todas as entidades |
| **Mobile é sempre PDV** (sem toggle) | Modo standalone com toggle | Não há motivo para operar com cadastros independentes. Mobile como PDV puro simplifica a UX e elimina risco de divergência de dados |
| **Dados locais preservados no primeiro sync** | Limpar banco e reimportar | Primeiro sync faz merge: itens do desktop substituem locais com mesmo ID, itens locais sem correspondência são mantidos |
| **Sync manual (botão)** | Sync automático periódico | Simplicidade inicial. Futuramente pode-se adicionar sync automático quando desktop for detectado |

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| Desktop não está na rede | UI mostra "Desktop não encontrado — Modo Offline". Vendas podem ser criadas normalmente e serão sincronizadas quando o desktop estiver disponível |
| Conflito de IDs entre mobile e desktop | Mobile usa UUIDs. Se ambos criarem registros com IDs diferentes, não há conflito. Se mobile criou produto localmente e desktop tem produto diferente com mesmo ID (improvável com UUID), o desktop vence no próximo pull |
| Venda rejeitada pelo desktop (estoque) | UI exibe o erro/warning recebido no ack. Venda permanece com status no mobile para retentativa |
| Porta 9999 bloqueada por firewall | Documentar. Fallback futuro para QR Code |
| `react-native-zeroconf` não funciona em todas as plataformas | Fallback para entrada manual de IP na UI de configuração |
| WebSocket desconecta durante sync | Reconexão automática com backoff exponencial. Estado de sync visível na UI |
