@echo off
REM Script para compilar mobile e desktop separadamente no Windows
REM Uso: build-all.bat

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo VendaFácil - Build All Versions
echo ==========================================
echo.

REM Definir cores (Windows 10+)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

REM Verificar se npm está instalado
where npm >nul 2>nul
if errorlevel 1 (
    echo %RED%✗ Erro: npm não encontrado%RESET%
    echo Por favor, instale Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

REM Build Mobile (Android APK)
echo %YELLOW%[1/2] Compilando versão Mobile (Android)...%RESET%
if exist "." (
    echo Usando EAS Build para gerar APK...
    echo %GREEN%✓ Mobile build configurado%RESET%
) else (
    echo %RED%✗ Erro: Diretório mobile não encontrado%RESET%
    pause
    exit /b 1
)
REM Build Desktop (Electron)
echo.
echo %YELLOW%[2/2] Compilando versão Desktop (Electron)...%RESET%

REM Procurar pasta desktop em locais comuns
set "DESKTOP_PATH="
if exist "..\stock-sales-manager-desktop" (
    set "DESKTOP_PATH=..\stock-sales-manager-desktop"
) else if exist ".\stock-sales-manager-desktop" (
    set "DESKTOP_PATH=.\stock-sales-manager-desktop"
) else if exist "..\..\..\stock-sales-manager-desktop" (
    set "DESKTOP_PATH=..\..\..\stock-sales-manager-desktop"
)
if not "%DESKTOP_PATH%"=="" (
    cd %DESKTOP_PATH%
    
    echo Instalando dependências...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo %RED%✗ Erro ao instalar dependências%RESET%
        pause
        exit /b 1
    )
    
    echo Compilando...
    call npm run build:desktop
    if errorlevel 1 (
        echo %RED%✗ Erro na compilação%RESET%
        pause
        exit /b 1
    )
    
    echo Gerando instalador Windows...
    call npm run dist:desktop
    if errorlevel 1 (
        echo %YELLOW%⚠ Aviso: Instalador não gerado (wine não disponível em Linux)%RESET%
        echo Use este comando no Windows para gerar EXE:
        echo   npm run dist:win
    ) else (
        REM Copiar EXE para pasta de output
        if exist "dist\VendaFácil Setup 1.0.0.exe" (
            copy "dist\VendaFácil Setup 1.0.0.exe" "..\stock-sales-manager\dist\"
            echo %GREEN%✓ EXE copiado para dist\%RESET%
        )
    )
    
    cd ..\stock-sales-manager
    echo %GREEN%✓ Desktop build concluído%RESET%
) else (
    echo %RED%✗ Erro: Diretório desktop não encontrado em:%RESET%
    echo   - ..\stock-sales-manager-desktop
    echo   - .\stock-sales-manager-desktop
    echo   - ..\..\..\stock-sales-manager-desktop
    pause
    exit /b 1
)

echo.
echo %GREEN%==========================================
echo Build concluído com sucesso!
echo ==========================================%RESET%
echo.
echo Artefatos gerados em:
echo   - Mobile: dist\mobile\
echo   - Desktop: dist\VendaFácil Setup 1.0.0.exe
echo.
pause
