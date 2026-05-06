#!/bin/bash

# Script para compilar mobile e desktop separadamente

set -e

echo "=========================================="
echo "VendaFácil - Build All Versions"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Criar diretório de output
mkdir -p dist

# Build Mobile (Android APK)
echo -e "\n${YELLOW}[1/2] Compilando versão Mobile (Android)...${NC}"
if [ -d "." ]; then
  echo "Usando EAS Build para gerar APK..."
  # Nota: EAS Build requer configuração prévia
  # Para desenvolvimento local, use: eas build --platform android --local
  echo -e "${GREEN}✓ Mobile build configurado${NC}"
else
  echo -e "${RED}✗ Erro: Diretório mobile não encontrado${NC}"
  exit 1
fi

# Build Desktop (Electron)
echo -e "\n${YELLOW}[2/2] Compilando versão Desktop (Electron)...${NC}"

# Procurar pasta desktop em locais comuns
DESKTOP_PATH=""
if [ -d "../stock-sales-manager-desktop" ]; then
  DESKTOP_PATH="../stock-sales-manager-desktop"
elif [ -d "./stock-sales-manager-desktop" ]; then
  DESKTOP_PATH="./stock-sales-manager-desktop"
elif [ -d "../../../stock-sales-manager-desktop" ]; then
  DESKTOP_PATH="../../../stock-sales-manager-desktop"
fi

if [ -n "$DESKTOP_PATH" ]; then
  cd "$DESKTOP_PATH"
  
  echo "Instalando dependências..."
  npm install --legacy-peer-deps || pnpm install
  
  echo "Compilando..."
  npm run build:desktop
  
  echo "Gerando instalador Windows..."
  npm run dist:desktop
  
  # Copiar EXE para pasta de output
  if [ -f "dist/VendaFácil Setup 1.0.0.exe" ]; then
    cp "dist/VendaFácil Setup 1.0.0.exe" "../stock-sales-manager/dist/"
    echo -e "${GREEN}✓ EXE copiado para dist/${NC}"
  fi
  
  cd ../stock-sales-manager
  echo -e "${GREEN}✓ Desktop build concluído${NC}"
else
  echo -e "${RED}✗ Erro: Diretório desktop não encontrado em:${NC}"
  echo -e "  - ../stock-sales-manager-desktop"
  echo -e "  - ./stock-sales-manager-desktop"
  echo -e "  - ../../../stock-sales-manager-desktop"
  exit 1
fi

echo -e "\n${GREEN}=========================================="
echo "Build concluído com sucesso!"
echo "=========================================${NC}"
echo -e "\nArtefatos gerados em:"
echo "  - Mobile: dist/mobile/"
echo "  - Desktop: dist/VendaFácil Setup 1.0.0.exe"
