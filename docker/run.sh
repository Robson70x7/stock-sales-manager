#!/bin/bash

echo "========================================="
echo "  Setup e Execução no Container"
echo "========================================="

# Verificar se a imagem existe
if ! docker image inspect stock-sales-rn-dev > /dev/null 2>&1; then
    echo "Imagem não encontrada. Execute primeiro:"
    echo "  ./docker/build.sh"
    exit 1
fi

# Verificar se há argumentos
if [ $# -eq 0 ]; then
    echo "Uso: $0 <comando>"
    echo "Exemplos:"
    echo "  $0 pnpm install"
    echo "  $0 pnpm migrations:generate"
    echo "  $0 pnpm android"
    echo "  $0 bash"
    exit 1
fi

docker run -it \
    -v $(pwd):/app \
    -p 8081:8081 \
    -p 8082:8082 \
    --memory="6g" \
    --cpus="3" \
    -e NODE_ENV=development \
    -e ANDROID_HOME=/opt/android-sdk \
    -e ANDROID_SDK_ROOT=/opt/android-sdk \
    -e ADB_SERVER_SOCKET=tcp:172.31.96.1:5037 \
    -e EXPO_PACKAGER_PROXY_URL=http://172.31.96.1:8081 \
    --name stock-sales-rn \
    stock-sales-rn-dev sh -c "cd /app && $*"