# 🚀 Script de Setup Automatizado - Dashboard Financeiro
# Este script configura o ambiente completo do projeto

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Dashboard Financeiro - Setup Automatizado    " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Bun está instalado
Write-Host "🔍 Verificando Bun..." -ForegroundColor Yellow
$bunInstalled = $false
try {
    $bunVersion = bun --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Bun $bunVersion instalado!" -ForegroundColor Green
        $bunInstalled = $true
    }
} catch {
    Write-Host "⚠️  Bun não encontrado, usando Node.js como fallback" -ForegroundColor Yellow
}

# Verificar Node.js
if (-not $bunInstalled) {
    Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js $nodeVersion instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js não encontrado! Instale Node.js ou Bun primeiro." -ForegroundColor Red
        exit 1
    }
}

# Criar arquivo .env no backend se não existir
Write-Host ""
Write-Host "📝 Configurando Backend..." -ForegroundColor Cyan

if (-not (Test-Path ".\backend\.env")) {
    Write-Host "📄 Criando arquivo .env a partir do .env.example..." -ForegroundColor Yellow
    Copy-Item ".\backend\.env.example" ".\backend\.env"
    
    # Gerar secrets JWT automaticamente
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = Get-Content ".\backend\.env" -Raw
    $envContent = $envContent -replace 'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production', "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace 'JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production', "JWT_REFRESH_SECRET=$jwtRefreshSecret"
    $envContent | Set-Content ".\backend\.env"
    
    Write-Host "✅ Arquivo .env criado com secrets gerados!" -ForegroundColor Green
    Write-Host "⚠️  LEMBRE-SE: Configure o DATABASE_URL no arquivo backend\.env" -ForegroundColor Yellow
} else {
    Write-Host "✅ Arquivo .env já existe!" -ForegroundColor Green
}

# Instalar dependências do Backend
Write-Host ""
Write-Host "📦 Instalando dependências do Backend..." -ForegroundColor Cyan
Set-Location ".\backend"

if ($bunInstalled) {
    bun install
} else {
    npm install
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências do Backend instaladas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências do Backend" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Gerar Prisma Client
Write-Host ""
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Cyan
if ($bunInstalled) {
    bun prisma generate
} else {
    npx prisma generate
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client gerado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aviso: Erro ao gerar Prisma Client (normal se DB não configurado)" -ForegroundColor Yellow
}

Set-Location ".."

# Instalar dependências do Frontend
Write-Host ""
Write-Host "📦 Instalando dependências do Frontend..." -ForegroundColor Cyan
Set-Location ".\frontend"

if ($bunInstalled) {
    bun install
} else {
    npm install
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências do Frontend instaladas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências do Frontend" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

# Resumo Final
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "            ✅ Setup Concluído!                   " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure o banco de dados PostgreSQL" -ForegroundColor White
Write-Host "   - Edite o arquivo: backend\.env" -ForegroundColor Gray
Write-Host "   - Configure DATABASE_URL=postgresql://user:pass@localhost:5432/dbname" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Execute as migrations do Prisma:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
if ($bunInstalled) {
    Write-Host "   bun prisma migrate dev" -ForegroundColor Gray
} else {
    Write-Host "   npx prisma migrate dev" -ForegroundColor Gray
}
Write-Host ""
Write-Host "3. Inicie o Backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
if ($bunInstalled) {
    Write-Host "   bun run dev" -ForegroundColor Gray
} else {
    Write-Host "   npm run dev" -ForegroundColor Gray
}
Write-Host ""
Write-Host "4. Em outro terminal, inicie o Frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
if ($bunInstalled) {
    Write-Host "   bun run dev" -ForegroundColor Gray
} else {
    Write-Host "   npm run dev" -ForegroundColor Gray
}
Write-Host ""
Write-Host "🚀 O frontend estará em: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 O backend estará em: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📚 API Docs estarão em: http://localhost:5000/api-docs" -ForegroundColor Cyan
Write-Host ""
