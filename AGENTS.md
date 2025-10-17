# Project instructions

- 🚫 **No crear migraciones de Django:** Bajo ninguna circunstancia se deben generar ni commitear nuevas migraciones. Cualquier cambio en el esquema debe aplicarse directamente sobre la base de datos PostgreSQL administrada por el equipo de infraestructura.
- 🗃️ **Cambios directos en la base de datos:** Si se requiere un ajuste estructural, coordinarlo con infraestructura y ejecutar SQL manualmente; el repositorio no debe reflejar esos cambios mediante archivos de migración.
- 🧪 **Automatizaciones existentes:** Ajustar scripts o pipelines para asumir que no habrá migraciones nuevas y que el esquema se mantiene por fuera del repositorio.

Estas reglas aplican a todo el repositorio.
