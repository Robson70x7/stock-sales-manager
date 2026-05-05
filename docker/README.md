# Docker - Ambiente de Desenvolvimento React Native

Este diretório contém a configuração Docker para desenvolvimento do app React Native com Android SDK.

## Estrutura

```
docker/
├── build.sh        # Build da imagem Docker
├── run.sh          # Rodar comandos no container
└── README.md       # Documentação
```

## Imagem Inclui

- Node.js 20 (Debian-based)
- pnpm
- Android SDK 34 (Android 14)
- Java 17

## Como Usar

### 1. Build da Imagem

```bash
cd docker
./build.sh
```

> ⚠️ Primeiro build pode levar ~10 minutos (download do Android SDK)

### 2. Primeiro Uso - Instalar Dependências

```bash
./docker/run.sh "rm -rf node_modules && pnpm install"
```

Este comando:
- Remove node_modules (se houver)
- Instala dependências compiladas para o Node.js do container

### 3. Executar Migrations

```bash
./docker/run.sh "pnpm migrations:generate"
```

### 4. Desenvolvimento (Android)

```bash
./docker/run.sh "pnpm android"
```

### 5. Gerar APK

```bash
./docker/run.sh "pnpm build:mobile"
```

O APK será salvo em `dist/mobile/`

## Fluxo de Trabalho Completo

```bash
# 1. Build da imagem (uma vez)
./docker/build.sh

# 2. Setup inicial (primeira vez ou quando houver problemas)
./docker/run.sh "rm -rf node_modules && pnpm install"

# 3. Gerar migrations
./docker/run.sh "pnpm migrations:generate"

# 4. Rodar no Android (hot reload)
./docker/run.sh "pnpm android"

# 5. Gerar APK para distribuição
./docker/run.sh "pnpm build:mobile"
```

## Comandos Úteis

```bash
# Terminal interativo dentro do container
./docker/run.sh bash

# Verificar versão do Node
./docker/run.sh node --version

# Verificar Android SDK
./docker/run.sh "echo \$ANDROID_HOME"

# Verificar se o adb está funcionando
./docker/run.sh adb version
```

## Troubleshooting

### "NODE_MODULE_VERSION" erro ao rodar migrations

Significa que o node_modules foi instalado em outra versão do Node. Execute:

```bash
./docker/run.sh "rm -rf node_modules && pnpm install"
```

### "sdkmanager not found"

```bash
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Erro de permissão ao criar arquivos

O diretório do projeto precisa ter permissões de escrita. Se houver problemas, remova o node_modules antes de rodar:

```bash
./docker/run.sh "rm -rf node_modules"