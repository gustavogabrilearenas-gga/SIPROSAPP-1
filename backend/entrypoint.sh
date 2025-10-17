#!/bin/sh
set -e

RUN_MIGRATIONS=${RUN_MIGRATIONS:-true}
CREATE_SUPERUSER=${CREATE_SUPERUSER:-true}

printf '⏳ Esperando a PostgreSQL...\n'
until python manage.py check --database default >/dev/null 2>&1; do
  printf 'PostgreSQL no está listo - esperando...\n'
  sleep 2
done
printf '✅ PostgreSQL está listo\n'

if [ "$RUN_MIGRATIONS" = "true" ]; then
  printf '🔄 Aplicando migraciones...\n'
  python manage.py migrate --noinput
else
  printf '⏭️ RUN_MIGRATIONS=false: omitiendo migrate\n'
fi

if [ "$CREATE_SUPERUSER" = "true" ]; then
  printf '👤 Verificando/creando superusuario por defecto...\n'
  python manage.py create_superuser_if_none
else
  printf '⏭️ CREATE_SUPERUSER=false: omitiendo creación de superusuario\n'
fi

printf '🚀 Iniciando servidor Django...\n'
exec "$@"
