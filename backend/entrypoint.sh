#!/bin/bash
set -e

echo "⏳ Esperando a PostgreSQL..."
until python manage.py check --database default > /dev/null 2>&1; do
  echo "PostgreSQL no está listo - esperando..."
  sleep 2
done
echo "✅ PostgreSQL está listo"

echo "🔄 Aplicando migraciones..."
python manage.py migrate --noinput

echo "👤 Verificando/creando superusuario por defecto..."
python manage.py create_superuser_if_none

echo "🚀 Iniciando servidor Django..."
exec "$@"

