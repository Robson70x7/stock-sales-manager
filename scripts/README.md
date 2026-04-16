# Scripts de Build - VendaFácil

Este diretório contém scripts para compilar as versões mobile e desktop do VendaFácil.

## Scripts Disponíveis

### 1. **build-all.sh** (Linux/macOS)
Script shell para compilar ambas as versões no Linux ou macOS.

**Uso:**
```bash
chmod +x scripts/build-all.sh
./scripts/build-all.sh
```

**O que faz:**
- Compila versão Mobile (Android APK)
- Compila versão Desktop (Electron)
- Gera instalador Windows
- Copia artefatos para pasta `dist/`

---

### 2. **build-all.bat** (Windows - CMD)
Script batch para compilar no Windows usando Command Prompt.

**Uso:**
```cmd
scripts\build-all.bat
```

**Ou abra diretamente:**
- Navegue até a pasta `scripts/`
- Clique duas vezes em `build-all.bat`

---

### 3. **build-all.ps1** (Windows - PowerShell)
Script PowerShell para compilar no Windows com melhor interface.

**Uso:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\build-all.ps1
```

**Ou abra diretamente:**
- Clique com botão direito em `build-all.ps1`
- Selecione "Executar com PowerShell"

---

## Requisitos

### Todos os sistemas:
- **Node.js** 18+ (https://nodejs.org/)
- **npm** ou **pnpm**
- **Git** (opcional, para versionamento)

### Para Mobile (Android):
- **EAS CLI** (`npm install -g eas-cli`)
- **Expo CLI** (`npm install -g expo-cli`)
- Conta Expo (gratuita em https://expo.dev/)

### Para Desktop (Windows):
- **Wine** (se compilar no Linux/macOS para gerar EXE)
- Ou execute no Windows diretamente

---

## Estrutura de Saída

Após executar os scripts, os artefatos serão gerados em:

```
dist/
├── mobile/
│   └── app-release.apk          # APK Android
├── VendaFácil-1.0.0-portable.zip # Desktop portável
├── VendaFácil Setup 1.0.0.exe     # Instalador Windows
└── LEIA-ME.txt                    # Instruções
```

---

## Compilação Manual

Se preferir compilar manualmente:

### Mobile (Android)
```bash
# Gerar APK
npm run build:mobile

# Preview
npm run android
```

### Desktop (Electron)
```bash
# Desenvolvimento
npm run dev:desktop

# Build
npm run build:desktop

# Gerar instalador Windows
npm run dist:win

# Gerar para macOS
npm run dist:mac

# Gerar para Linux
npm run dist:linux
```

---

## Troubleshooting

### Erro: "npm não encontrado"
- Instale Node.js em https://nodejs.org/
- Reinicie o terminal/PowerShell

### Erro: "wine is required"
- Você está tentando gerar EXE no Linux
- Instale wine: `sudo apt-get install wine`
- Ou compile no Windows diretamente

### Erro: "Permission denied" (Linux/macOS)
```bash
chmod +x scripts/build-all.sh
```

### Erro: "não é reconhecido como um comando interno" (Windows)
- Use o caminho completo: `scripts\build-all.bat`
- Ou abra o PowerShell em vez do CMD

---

## Próximas Etapas

1. **Testar no dispositivo:**
   - Mobile: Escaneie QR code com Expo Go
   - Desktop: Execute `dist/portable/VendaFácil.exe`

2. **Sincronizar dados:**
   - Conecte ambos na mesma rede Wi-Fi
   - Clique em "Sincronizar" em ambos os apps
   - Dados serão sincronizados automaticamente

3. **Publicar:**
   - Mobile: Google Play Store (com EAS Build)
   - Desktop: Distribua o instalador EXE

---

## Suporte

Para mais informações:
- Documentação: `SYNC_ARCHITECTURE.md`
- Issues: [seu repositório]
- Contato: [seu email]

---

**VendaFácil v2.0** | Desenvolvido com Electron + React Native
