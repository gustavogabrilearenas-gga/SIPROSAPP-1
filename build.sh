#!/usr/bin/env bash
# Script de build para Render

set -o errexit  # Exit on error

echo "[BUILD] Instalando dependencias..."
pip install -r requirements.txt

echo "[BUILD] Recolectando archivos estaticos..."
python manage.py collectstatic --noinput

echo "[BUILD] Generando migraciones pendientes..."
python manage.py makemigrations --noinput

echo "[BUILD] Aplicando todas las migraciones..."
python manage.py migrate --noinput

echo "[BUILD] Creando superusuario si no existe..."
python manage.py create_superuser_if_none

echo "[BUILD] Build completado exitosamente!"
