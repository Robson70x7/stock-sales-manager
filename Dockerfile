FROM node:20

LABEL maintainer="robson"
LABEL description="Desenvolvimento React Native + Android SDK"

# ============================================================
# Variáveis de Ambiente
# ============================================================
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# ============================================================
# Instalar dependências do sistema
# ============================================================
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    bash \
    rsync \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Download e configurar Android SDK
# ============================================================
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdtools.zip && \
    unzip -q /tmp/cmdtools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmdtools.zip

# ============================================================
# Aceitar licenças e instalar componentes necessários
# ============================================================
RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses || true && \
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;26.1.10909125" \
    "cmake;3.22.1"

# ============================================================
# Configurações de locale para evitar warnings
# ============================================================
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# ============================================================
# Instalar pnpm globalmente
# ============================================================
RUN npm install -g pnpm

# ============================================================
# Criar diretório de trabalho
# ============================================================
WORKDIR /app

# ============================================================
# Expor portas necessárias
# ============================================================
# Metro Bundler
EXPOSE 8081
# Expo
EXPOSE 8082

# ============================================================
# Por padrão, manter o container vivo para debug
# ============================================================
CMD ["sh"]