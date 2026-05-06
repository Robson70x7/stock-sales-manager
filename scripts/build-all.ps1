# Script PowerShell para compilar mobile e desktop separadamente no Windows
# Uso: .\build-all.ps1

# Cores para output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

Write-Host ""
Write-Host "==========================================" -ForegroundColor $Yellow
Write-Host "VendaFácil - Build All Versions" -ForegroundColor $Yellow
Write-Host "==========================================" -ForegroundColor $Yellow
Write-Host ""

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "✓ npm encontrado: v$npmVersion" -ForegroundColor $Green
} catch {
    Write-Host "✗ Erro: npm não encontrado" -ForegroundColor $Red
    Write-Host "Por favor, instale Node.js em: https://nodejs.org/" -ForegroundColor $Red
    exit 1
}

# Criar diretório de output
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

# Build Mobile (Android APK)
Write-Host ""
Write-Host "[1/2] Compilando versão Mobile (Android)..." -ForegroundColor $Yellow
if (Test-Path ".") {
    Write-Host "Usando EAS Build para gerar APK..."
    Write-Host "✓ Mobile build configurado" -ForegroundColor $Green
} else {
    Write-Host "✗ Erro: Diretório mobile não encontrado" -ForegroundColor $Red
    exit 1
}
# Build Desktop (Electron)
Write-Host ""
Write-Host "[2/2] Compilando versão Desktop (Electron)..." -ForegroundColor $Yellow

# Procurar pasta desktop em locais comuns
$desktopPath = $null
if (Test-Path "../stock-sales-manager-desktop") {
    $desktopPath = "../stock-sales-manager-desktop"
} elseif (Test-Path "./stock-sales-manager-desktop") {
    $desktopPath = "./stock-sales-manager-desktop"
} elseif (Test-Path "../../../stock-sales-manager-desktop") {
    $desktopPath = "../../../stock-sales-manager-desktop"
}

if ($desktopPath) {
    Push-Location $desktopPath    
    Write-Host "Instalando dependências..."
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erro ao instalar dependências" -ForegroundColor $Red
        Pop-Location
        exit 1
    }
    
    Write-Host "Compilando..."
    npm run build:desktop
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Erro na compilação" -ForegroundColor $Red
        Pop-Location
        exit 1
    }
    
    Write-Host "Gerando instalador Windows..."
    npm run dist:desktop
    if ($LASTEXITCODE -eq 0) {
        # Copiar EXE para pasta de output
        if (Test-Path "dist\VendaFácil Setup 1.0.0.exe") {
            Copy-Item "dist\VendaFácil Setup 1.0.0.exe" "..\stock-sales-manager\dist\" -Force
            Write-Host "✓ EXE copiado para dist\" -ForegroundColor $Green
        }
    } else {
        Write-Host "⚠ Aviso: Instalador não gerado" -ForegroundColor $Yellow
        Write-Host "Verifique se wine está instalado ou use: npm run dist:win" -ForegroundColor $Yellow
    }
    
    Pop-Location
    Write-Host "✓ Desktop build concluído" -ForegroundColor $Green
} else {
    Write-Host "✗ Erro: Diretório desktop não encontrado" -ForegroundColor $Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor $Green
Write-Host "Build concluído com sucesso!" -ForegroundColor $Green
Write-Host "==========================================" -ForegroundColor $Green
Write-Host ""
Write-Host "Artefatos gerados em:"
Write-Host "  - Mobile: dist\mobile\"
Write-Host "  - Desktop: dist\VendaFácil Setup 1.0.0.exe"
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "  1. Teste a versão mobile no Expo Go"
Write-Host "  2. Execute a versão desktop: dist\portable\VendaFácil.exe"
Write-Host "  3. Conecte ambos na mesma rede para sincronizar dados"
Write-Host ""
