#!/bin/bash

echo "========================================="
echo "  Build de APK com mais memória"
echo "========================================="

# Verificar se a imagem existe
if ! docker image inspect stock-sales-rn-dev > /dev/null 2>&1; then
    echo "Imagem não encontrada. Execute primeiro:"
    echo "  ./docker/build.sh"
    exit 1
fi

# Criar diretório de saída
mkdir -p dist/mobile

# Definir propriedades do Gradle para usar menos memória
GRADLE_OPTS="-Xmx2g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError"

# Executar build no container
docker run --rm \
    -v $(pwd):/app \
    -e NODE_ENV=production \
    -e ANDROID_HOME=/opt/android-sdk \
    -e ANDROID_SDK_ROOT=/opt/android-sdk \
    -e CI=true \
    -e GRADLE_OPTS="$GRADLE_OPTS" \
    --name stock-sales-rn-build \
    --memory=4g \
    stock-sales-rn-dev sh -c "
        cd /app
        cd android
        ./gradlew assembleDebug --no-daemon -Dorg.gradle.jvmargs='-Xmx4g'
    "

# Listar APK gerado
echo ""
echo "========================================="
echo "  APK Gerado!"
echo "========================================="
find dist -name "*.apk" 2>/dev/null || echo "Nenhum APK encontrado"