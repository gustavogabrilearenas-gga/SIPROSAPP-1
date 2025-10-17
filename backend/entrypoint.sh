#!/bin/sh
set -e

RUN_MIGRATIONS=${RUN_MIGRATIONS:-false}
CREATE_SUPERUSER=${CREATE_SUPERUSER:-true}

printf '⏳ Esperando a PostgreSQL...\n'
until python manage.py check --database default >/dev/null 2>&1; do
  printf 'PostgreSQL no está listo - esperando...\n'
  sleep 2
done
printf '✅ PostgreSQL está listo\n'

if [ "$RUN_MIGRATIONS" = "true" ]; then
  printf '🚫 Las migraciones de Django están deshabilitadas por política del proyecto. Ajusta la base de datos manualmente.\n'
fi

printf '⏭️ Las migraciones siempre se omiten; se espera que la base de datos esté sincronizada manualmente.\n'

if [ "$CREATE_SUPERUSER" = "true" ]; then
  printf '👤 Verificando/creando superusuario por defecto...\n'
  python manage.py create_superuser_if_none
else
  printf '⏭️ CREATE_SUPERUSER=false: omitiendo creación de superusuario\n'
fi

printf '🚀 Iniciando servidor Django...\n'
exec "$@"
