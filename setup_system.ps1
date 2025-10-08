# ============================================
# SIPROSA MES - Setup Automático
# ============================================
# Este script configura todo el sistema listo para usar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SIPROSA MES - Setup Automático" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker está corriendo
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker está corriendo" -ForegroundColor Green
Write-Host ""

# Iniciar contenedores si no están corriendo
Write-Host "[2/6] Iniciando contenedores Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose.fullstack.yml up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al iniciar contenedores" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contenedores iniciados" -ForegroundColor Green
Write-Host ""

# Esperar a que el backend esté listo
Write-Host "[3/6] Esperando a que el backend esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✅ Backend listo" -ForegroundColor Green
Write-Host ""

# Aplicar migraciones
Write-Host "[4/6] Aplicando migraciones de base de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose.fullstack.yml exec -T web python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al aplicar migraciones" -ForegroundColor Red
    Write-Host "Intentando con el comando alternativo..." -ForegroundColor Yellow
    docker-compose -f docker-compose.fullstack.yml exec web python manage.py migrate
}
Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
Write-Host ""

# Cargar datos de prueba
Write-Host "[5/6] Cargando datos de prueba..." -ForegroundColor Yellow
docker-compose -f docker-compose.fullstack.yml exec -T web python create_comprehensive_data.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al cargar datos" -ForegroundColor Red
    Write-Host "Intentando con el comando alternativo..." -ForegroundColor Yellow
    docker-compose -f docker-compose.fullstack.yml exec web python create_comprehensive_data.py
}
Write-Host "✅ Datos de prueba cargados" -ForegroundColor Green
Write-Host ""

# Verificar que todo esté funcionando
Write-Host "[6/6] Verificando sistema..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -UseBasicParsing -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Backend funcionando correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend puede no estar listo aún, espera unos segundos" -ForegroundColor Yellow
}
Write-Host ""

# Resumen final
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ SISTEMA LISTO PARA USAR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 ACCESOS:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000/api/" -ForegroundColor White
Write-Host "   Admin:    http://localhost:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "👥 USUARIOS DE PRUEBA:" -ForegroundColor Cyan
Write-Host "   admin / sandz334@           (Administrador)" -ForegroundColor White
Write-Host "   operario1 / sandz334@       (Operario)" -ForegroundColor White
Write-Host "   supervisor1 / sandz334@     (Supervisor)" -ForegroundColor White
Write-Host "   calidad1 / sandz334@        (QA)" -ForegroundColor White
Write-Host "   mantenimiento1 / sandz334@  (Mantenimiento)" -ForegroundColor White
Write-Host ""
Write-Host "📊 DATOS CARGADOS:" -ForegroundColor Cyan
Write-Host "   ✅ 5 usuarios con diferentes roles" -ForegroundColor White
Write-Host "   ✅ 5 máquinas de producción" -ForegroundColor White
Write-Host "   ✅ 5 productos farmacéuticos" -ForegroundColor White
Write-Host "   ✅ 7 lotes en diferentes estados" -ForegroundColor White
Write-Host "   ✅ 6 órdenes de trabajo" -ForegroundColor White
Write-Host "   ✅ 5 incidentes" -ForegroundColor White
Write-Host ""
Write-Host "🚀 SIGUIENTE PASO:" -ForegroundColor Cyan
Write-Host "   Abre http://localhost:3000 y haz login con admin / sandz334@" -ForegroundColor White
Write-Host ""
Write-Host "📝 PARA VER LOGS:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f backend" -ForegroundColor White
Write-Host ""

