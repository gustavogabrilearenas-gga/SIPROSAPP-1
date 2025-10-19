#!/bin/sh
set -e

# Variables con defaults razonables
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
CREATE_SUPERUSER=${CREATE_SUPERUSER:-true}

echo "⏳ Esperando PostgreSQL en $DB_HOST:$DB_PORT..."
# Si no tenés pg_isready disponible en la imagen, podés omitir este bloque y confiar en 'migrate' con reintentos.
until python -c "import socket; s=socket.socket(); s.settimeout(2); s.connect(('$DB_HOST',$DB_PORT)); s.close()" >/dev/null 2>&1; do
  echo "PostgreSQL no responde aún..."
  sleep 2
done
echo "✅ PostgreSQL responde a nivel de socket"

echo "🗂️ Aplicando migraciones (idempotente)..."
python manage.py migrate --noinput

if [ "$CREATE_SUPERUSER" = "true" ]; then
  echo "👤 Creando superusuario si no existe..."
  python manage.py create_superuser_if_none
fi

echo "🚀 Iniciando servidor..."
exec "$@"
