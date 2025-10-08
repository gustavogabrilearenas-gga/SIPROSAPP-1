# ============================================
# SIPROSA MES - Setup Local (Sin Docker)
# ============================================
# Este script configura el sistema usando Python local

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SIPROSA MES - Setup Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "manage.py")) {
    Write-Host "❌ Error: No se encuentra manage.py" -ForegroundColor Red
    Write-Host "   Por favor ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Activar entorno virtual si existe
Write-Host "[1/5] Activando entorno virtual..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
    Write-Host "✅ Entorno virtual activado" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se encontró entorno virtual, usando Python global" -ForegroundColor Yellow
}
Write-Host ""

# Aplicar migraciones
Write-Host "[2/5] Aplicando migraciones de base de datos..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al aplicar migraciones" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
Write-Host ""

# Cargar datos de prueba
Write-Host "[3/5] Cargando datos de prueba..." -ForegroundColor Yellow
python create_comprehensive_data.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al cargar datos" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Datos de prueba cargados" -ForegroundColor Green
Write-Host ""

# Instrucciones para iniciar el backend
Write-Host "[4/5] Backend configurado" -ForegroundColor Yellow
Write-Host "   Para iniciar: python manage.py runserver 0.0.0.0:8000" -ForegroundColor White
Write-Host ""

# Instrucciones para el frontend
Write-Host "[5/5] Frontend" -ForegroundColor Yellow
Write-Host "   En otra terminal:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

# Resumen final
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ BASE DE DATOS LISTA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 PARA INICIAR EL SISTEMA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Backend (esta terminal):" -ForegroundColor Yellow
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor White
Write-Host ""
Write-Host "2. Frontend (nueva terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 DESPUÉS ACCEDE A:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000/api/" -ForegroundColor White
Write-Host ""
Write-Host "👥 USUARIOS:" -ForegroundColor Cyan
Write-Host "   admin / sandz334@" -ForegroundColor White
Write-Host "   operario1 / sandz334@" -ForegroundColor White
Write-Host "   supervisor1 / sandz334@" -ForegroundColor White
Write-Host "   calidad1 / sandz334@" -ForegroundColor White
Write-Host "   mantenimiento1 / sandz334@" -ForegroundColor White
Write-Host ""

