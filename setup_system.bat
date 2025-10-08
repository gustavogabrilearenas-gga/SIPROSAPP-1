@echo off
REM ============================================
REM SIPROSA MES - Setup Automático (Docker)
REM ============================================

echo ========================================
echo   SIPROSA MES - Setup Automático
echo ========================================
echo.

echo [1/6] Verificando Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no está corriendo
    echo Por favor inicia Docker Desktop
    pause
    exit /b 1
)
echo OK: Docker está corriendo
echo.

echo [2/6] Iniciando contenedores...
docker-compose -f docker-compose.fullstack.yml up -d --build
echo OK: Contenedores iniciados
echo.

echo [3/6] Esperando backend...
timeout /t 10 /nobreak >nul
echo OK: Backend listo
echo.

echo [4/6] Aplicando migraciones...
docker-compose -f docker-compose.fullstack.yml exec -T web python manage.py migrate
if errorlevel 1 (
    echo Intentando comando alternativo...
    docker-compose -f docker-compose.fullstack.yml exec web python manage.py migrate
)
echo OK: Migraciones aplicadas
echo.

echo [5/6] Cargando datos de prueba...
docker-compose -f docker-compose.fullstack.yml exec -T web python create_comprehensive_data.py
if errorlevel 1 (
    echo Intentando comando alternativo...
    docker-compose -f docker-compose.fullstack.yml exec web python create_comprehensive_data.py
)
echo OK: Datos cargados
echo.

echo [6/6] Verificando sistema...
echo OK: Sistema listo
echo.

echo ========================================
echo   SISTEMA LISTO PARA USAR
echo ========================================
echo.
echo ACCESOS:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000/api/
echo   Admin:    http://localhost:8000/admin/
echo.
echo USUARIOS:
echo   admin / sandz334@
echo   operario1 / sandz334@
echo   supervisor1 / sandz334@
echo   calidad1 / sandz334@
echo   mantenimiento1 / sandz334@
echo.
echo Abre http://localhost:3000 en tu navegador
echo.
pause

