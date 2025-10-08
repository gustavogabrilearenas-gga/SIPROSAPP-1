#!/usr/bin/env python
"""
SIPROSA MES - Setup y Verificación Automática
Este script configura y verifica que el sistema esté listo para usar.
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*50}")
    print(f"  {text}")
    print(f"{'='*50}{Colors.ENDC}\n")

def print_step(step, total, text):
    print(f"{Colors.YELLOW}[{step}/{total}] {text}...{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def run_command(command, description, critical=True):
    """Ejecuta un comando y maneja errores"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print_success(description)
        return True
    except subprocess.CalledProcessError as e:
        if critical:
            print_error(f"{description} - Error: {e.stderr[:200]}")
            return False
        else:
            print_warning(f"{description} - Continuando...")
            return True

def check_file_exists(filepath, description):
    """Verifica que un archivo existe"""
    if Path(filepath).exists():
        print_success(f"{description} existe")
        return True
    else:
        print_error(f"{description} no encontrado")
        return False

def main():
    print_header("SIPROSA MES - Setup Automático")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print_error("No se encuentra manage.py")
        print("Por favor ejecuta este script desde el directorio raíz del proyecto")
        sys.exit(1)
    
    print_success("Directorio correcto detectado")
    
    # Verificar archivos importantes
    print("\n" + Colors.CYAN + "Verificando archivos..." + Colors.ENDC)
    files_ok = all([
        check_file_exists('core/models.py', 'models.py'),
        check_file_exists('core/views.py', 'views.py'),
        check_file_exists('core/serializers.py', 'serializers.py'),
        check_file_exists('create_comprehensive_data.py', 'Seeder de datos'),
        check_file_exists('core/migrations/0006_desviacion_documentoversionado.py', 'Migración 0006'),
    ])
    
    if not files_ok:
        print_error("Algunos archivos necesarios no se encontraron")
        sys.exit(1)
    
    # Configurar Django
    print("\n" + Colors.CYAN + "Configurando Django..." + Colors.ENDC)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    
    try:
        import django
        django.setup()
        print_success("Django configurado")
    except Exception as e:
        print_error(f"Error configurando Django: {e}")
        sys.exit(1)
    
    # Aplicar migraciones
    print_step(1, 4, "Aplicando migraciones")
    if not run_command('python manage.py migrate', 'Migraciones aplicadas'):
        sys.exit(1)
    
    # Verificar si ya hay datos
    print_step(2, 4, "Verificando datos existentes")
    try:
        from core.models import User, Lote, Maquina, Producto
        
        user_count = User.objects.count()
        lote_count = Lote.objects.count()
        maquina_count = Maquina.objects.count()
        producto_count = Producto.objects.count()
        
        print(f"   - Usuarios: {user_count}")
        print(f"   - Lotes: {lote_count}")
        print(f"   - Máquinas: {maquina_count}")
        print(f"   - Productos: {producto_count}")
        
        if user_count > 0 and lote_count > 0:
            print_warning("Ya existen datos en la base de datos")
            response = input(f"\n{Colors.YELLOW}¿Deseas recargar los datos? Esto borrará datos existentes (s/N): {Colors.ENDC}")
            if response.lower() != 's':
                print_success("Manteniendo datos existentes")
                print("\n" + Colors.GREEN + Colors.BOLD + "Sistema verificado y listo!" + Colors.ENDC)
                print_system_info()
                return
        
        # Cargar datos de prueba
        print_step(3, 4, "Cargando datos de prueba")
        if not run_command('python create_comprehensive_data.py', 'Datos de prueba cargados'):
            print_warning("Hubo un problema cargando datos, pero continuamos...")
        
    except Exception as e:
        print_error(f"Error verificando datos: {e}")
        sys.exit(1)
    
    # Verificar que los datos se cargaron
    print_step(4, 4, "Verificando datos cargados")
    try:
        user_count = User.objects.count()
        lote_count = Lote.objects.count()
        maquina_count = Maquina.objects.count()
        producto_count = Producto.objects.count()
        
        if user_count >= 5 and lote_count >= 5:
            print_success("Datos verificados correctamente")
            print(f"   - {user_count} usuarios")
            print(f"   - {lote_count} lotes")
            print(f"   - {maquina_count} máquinas")
            print(f"   - {producto_count} productos")
        else:
            print_warning("Hay algunos datos pero menos de lo esperado")
            
    except Exception as e:
        print_error(f"Error verificando datos finales: {e}")
    
    # Resumen final
    print_header("✅ SISTEMA LISTO PARA USAR")
    print_system_info()

def print_system_info():
    """Imprime información de acceso al sistema"""
    print(f"{Colors.CYAN}{Colors.BOLD}🌐 ACCESOS:{Colors.ENDC}")
    print(f"   Frontend: {Colors.GREEN}http://localhost:3000{Colors.ENDC}")
    print(f"   Backend:  {Colors.GREEN}http://localhost:8000/api/{Colors.ENDC}")
    print(f"   Admin:    {Colors.GREEN}http://localhost:8000/admin/{Colors.ENDC}")
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}👥 USUARIOS DE PRUEBA:{Colors.ENDC}")
    print(f"   {Colors.GREEN}admin{Colors.ENDC} / sandz334@           (Administrador)")
    print(f"   {Colors.GREEN}operario1{Colors.ENDC} / sandz334@       (Operario)")
    print(f"   {Colors.GREEN}supervisor1{Colors.ENDC} / sandz334@     (Supervisor)")
    print(f"   {Colors.GREEN}calidad1{Colors.ENDC} / sandz334@        (QA)")
    print(f"   {Colors.GREEN}mantenimiento1{Colors.ENDC} / sandz334@  (Mantenimiento)")
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}🚀 SIGUIENTE PASO:{Colors.ENDC}")
    print(f"   1. Inicia el backend: {Colors.YELLOW}python manage.py runserver 0.0.0.0:8000{Colors.ENDC}")
    print(f"   2. En otra terminal, inicia el frontend: {Colors.YELLOW}cd frontend && npm run dev{Colors.ENDC}")
    print(f"   3. Abre {Colors.GREEN}http://localhost:3000{Colors.ENDC} en tu navegador")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Setup cancelado por el usuario{Colors.ENDC}")
        sys.exit(0)
    except Exception as e:
        print_error(f"Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

