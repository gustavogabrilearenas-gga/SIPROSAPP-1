#!/usr/bin/env python
"""
Script para aplicar migraciones y verificar que el sistema funcione
"""

import os
import sys
import subprocess
import django
from pathlib import Path

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, str(Path(__file__).parent))

def main():
    print("🚀 Aplicando migraciones de SIPROSA MES...")

    try:
        django.setup()
        print("✅ Django configurado")

        # Aplicar migraciones
        print("📦 Aplicando migraciones...")
        result = subprocess.run([
            sys.executable, 'manage.py', 'migrate'
        ], capture_output=True, text=True, check=True)

        print("✅ Migraciones aplicadas exitosamente")
        print(result.stdout)

        # Verificar que las tablas existen
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_name LIKE 'core_%'
            """)
            table_count = cursor.fetchone()[0]

        print(f"✅ Se encontraron {table_count} tablas del core")

        # Verificar health check
        from core.models import Maquina
        maquina_count = Maquina.objects.count()
        print(f"✅ Health check: {maquina_count} máquinas encontradas")

        print("\n🎉 ¡Sistema listo! Los cambios han sido aplicados correctamente.")
        print("\nPara iniciar el servidor:")
        print("  Backend: python manage.py runserver")
        print("  Frontend: cd frontend && npm run dev")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
