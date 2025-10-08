#!/bin/bash
# Script para generar migraciones (solo para referencia, no se ejecutará en Windows)
python manage.py makemigrations
python manage.py migrate
