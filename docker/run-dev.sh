#!/bin/bash

echo "========================================="
echo "  Setup inicial do container"
echo "========================================="

# Verificar se a imagem existe
if ! docker image inspect stock-sales-rn-dev > /dev/null 2>&1; then
    echo "Imagem não encontrada. Execute primeiro:"
    echo "  ./docker/build.sh"
    exit 1
fi

# Criar diretório de trabalho temporário
TEMP_DIR=$(mktemp -d)

# Copiar projeto para diretório temporário (sem node_modules)
echo "Copiando projeto..."
rsync -av --exclude node_modules --exclude .git --exclude dist . "$TEMP_DIR/"

# Rodar container com o projeto copiado
docker run --rm -it \
    -v "$TEMP_DIR:/app" \
    -p 8081:8081 \
    -p 8082:8082 \
    -e NODE_ENV=development \
    -e ANDROID_HOME=/opt/android-sdk \
    -e ANDROID_SDK_ROOT=/opt/android-sdk \
    --name stock-sales-rn \
    stock-sales-rn-dev "$@"

# Limpar diretório temporário
rm -rf "$TEMP_DIR"