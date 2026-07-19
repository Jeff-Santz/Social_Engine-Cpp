# deploy.ps1

# 1. Configure os caminhos absolutos ou relativos
$FRONTEND_DIR = "$PSScriptRoot\frontend"
$BACKEND_BUILD_DIR = "$PSScriptRoot\build"

Write-Host ">> Iniciando Pipeline de Deploy Local..." -ForegroundColor Cyan

# 2. Limpa a build antiga no backend
Write-Host ">> Removendo pasta dist antiga do servidor..."
Remove-Item -Recurse -Force "$BACKEND_BUILD_DIR\dist" -ErrorAction SilentlyContinue

# 3. Compila o Frontend
Write-Host ">> Executando npm run build no Frontend..."
Set-Location -Path $FRONTEND_DIR
npm run build

# 4. Verifica se a compilação gerou a pasta dist
if (-Not (Test-Path -Path "dist")) {
    Write-Host "ERRO: Pasta dist não encontrada. O build do Vue falhou." -ForegroundColor Red
    Set-Location -Path $PSScriptRoot
    exit 1
}

# 5. Copia a nova build para o diretório de execução do C++
Write-Host ">> Copiando novos arquivos estaticos para o Backend..."
Copy-Item -Path "dist" -Destination "$BACKEND_BUILD_DIR\dist" -Recurse -Force

# 6. Retorna ao diretório original
Set-Location -Path $PSScriptRoot
Write-Host ">> Deploy concluido com sucesso. Frontend atualizado!" -ForegroundColor Green