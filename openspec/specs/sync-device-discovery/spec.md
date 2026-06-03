## ADDED Requirements

### Requirement: Descobrir desktop via mDNS

O sistema MUST descobrir automaticamente desktops na rede local via mDNS.

#### Scenario: Desktop disponível na rede

- **WHEN** o mobile inicia a descoberta mDNS
- **AND** um desktop está anunciando `_vendafacil._tcp` na rede
- **THEN** o sistema MUST detectar o desktop
- **AND** MUST extrair o endereço IP do serviço mDNS
- **AND** MUST adicionar à lista de dispositivos encontrados

#### Scenario: Múltiplos desktops na rede

- **WHEN** existem 2 ou mais desktops anunciando `_vendafacil._tcp`
- **THEN** o sistema MUST listar todos na UI
- **AND** MUST permitir que o usuário selecione qual conectar

#### Scenario: Nenhum desktop encontrado

- **WHEN** a busca mDNS não encontra serviços após 10 segundos
- **THEN** o sistema MUST parar a busca
- **AND** MUST exibir "Nenhum desktop encontrado" na UI
- **AND** MUST oferecer opção de conectar manualmente via IP

### Requirement: Conexão manual via IP

O sistema MUST permitir conexão manual informando o endereço IP do desktop.

#### Scenario: Usuário informa IP manualmente

- **WHEN** o usuário digita um endereço IP na tela de configuração
- **AND** clica em "Conectar"
- **THEN** o sistema MUST tentar conectar via WebSocket em `ws://<ip>:9999`
- **AND** MUST executar handshake
- **AND** MUST salvar o IP para reconexões futuras

### Requirement: Monitoramento de presença

O sistema MUST monitorar a presença do desktop na rede e reagir a mudanças.

#### Scenario: Desktop fica indisponível

- **WHEN** o desktop conectado sai da rede
- **AND** a conexão WebSocket é perdida
- **THEN** o sistema MUST atualizar estado do dispositivo para `offline`
- **AND** MUST iniciar reconexão automática

#### Scenario: Desktop retorna à rede

- **WHEN** o desktop reconecta à rede
- **AND** o mDNS detecta o serviço novamente
- **THEN** o sistema MUST tentar reconexão automática
