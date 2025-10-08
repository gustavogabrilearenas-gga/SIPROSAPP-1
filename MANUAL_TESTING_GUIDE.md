# Guía de Pruebas Manuales - SIPROSA MES Frontend

## Credenciales de Prueba
- **Usuario:** admin
- **Contraseña:** sandz334@

## Servidores Requeridos
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000

## Módulos a Probar

### 1. 🔐 Login
**URL:** http://localhost:3000/login

**Pruebas:**
- [ ] Ingresar credenciales correctas (admin/sandz334@)
- [ ] Verificar redirección al dashboard
- [ ] Probar credenciales incorrectas
- [ ] Verificar mensajes de error

### 2. 📦 Productos
**URL:** http://localhost:3000/productos

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Producto" → Llenar formulario:
  - Código: TEST-PROD-001
  - Nombre: Producto de Prueba
  - Principio Activo: Principio Activo Test
  - Concentración: 500mg
  - Forma Farmacéutica: COMPRIMIDO
  - Requiere Cadena Frío: No
  - Registro ANMAT: TEST-ANMAT-001
- [ ] **EDITAR:** Click en producto creado → Modificar nombre a "Producto Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 3. 🧪 Fórmulas
**URL:** http://localhost:3000/formulas

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Fórmula" → Llenar formulario:
  - Nombre: Fórmula de Prueba
  - Descripción: Descripción de prueba
  - Versión: 1.0
- [ ] **EDITAR:** Click en fórmula creada → Modificar nombre a "Fórmula Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 4. ⚙️ Máquinas
**URL:** http://localhost:3000/maquinas

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Máquina" → Llenar formulario:
  - Nombre: Máquina de Prueba
  - Código: MAQ-TEST-001
  - Tipo: PRODUCCION
  - Ubicación: Sala de Producción
- [ ] **EDITAR:** Click en máquina creada → Modificar nombre a "Máquina Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 5. 📋 Lotes
**URL:** http://localhost:3000/lotes

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Lote" → Llenar formulario:
  - Número de Lote: LOTE-TEST-001
  - Cantidad a Producir: 1000
  - Fecha de Inicio: 2024-01-01
  - Producto: Seleccionar producto existente
- [ ] **EDITAR:** Click en lote creado → Modificar cantidad a 1500
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 6. 📦 Inventario
**URL:** http://localhost:3000/inventario

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Insumo" → Llenar formulario:
  - Código: INV-TEST-001
  - Nombre: Insumo de Prueba
  - Tipo: INSUMO
  - Unidad de Medida: KG
- [ ] **EDITAR:** Click en insumo creado → Modificar nombre a "Insumo Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 7. 🔧 Mantenimiento
**URL:** http://localhost:3000/mantenimiento

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Orden" → Llenar formulario:
  - Título: Orden de Prueba
  - Descripción: Descripción de prueba
  - Prioridad: MEDIA
  - Tipo de Mantenimiento: Seleccionar tipo existente
- [ ] **EDITAR:** Click en orden creada → Modificar título a "Orden Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 8. ⚠️ Incidentes
**URL:** http://localhost:3000/incidentes

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Incidente" → Llenar formulario:
  - Título: Incidente de Prueba
  - Descripción: Descripción de incidente de prueba
  - Severidad: MEDIA
- [ ] **EDITAR:** Click en incidente creado → Modificar título a "Incidente Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 9. 📊 Desviaciones
**URL:** http://localhost:3000/desviaciones

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Desviación" → Llenar formulario:
  - Título: Desviación de Prueba
  - Descripción: Descripción de desviación de prueba
  - Severidad: MEDIA
- [ ] **EDITAR:** Click en desviación creada → Modificar título a "Desviación Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 10. ✅ Control Calidad
**URL:** http://localhost:3000/control-calidad

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Control" → Llenar formulario:
  - Nombre: Control de Prueba
  - Descripción: Descripción de control de prueba
  - Tipo: FISICO
- [ ] **EDITAR:** Click en control creado → Modificar nombre a "Control Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 11. 📈 KPIs
**URL:** http://localhost:3000/kpis

**Pruebas:**
- [ ] Verificar carga de métricas del dashboard
- [ ] Probar filtros de fecha
- [ ] Probar exportación de datos (si disponible)
- [ ] Verificar gráficos y estadísticas

### 12. 📍 Ubicaciones
**URL:** http://localhost:3000/ubicaciones

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Ubicación" → Llenar formulario:
  - Nombre: Ubicación de Prueba
  - Código: UBI-TEST-001
  - Descripción: Descripción de ubicación de prueba
- [ ] **EDITAR:** Click en ubicación creada → Modificar nombre a "Ubicación Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 13. 🕐 Turnos
**URL:** http://localhost:3000/turnos

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Turno" → Llenar formulario:
  - Nombre: Turno de Prueba
  - Hora de Inicio: 08:00
  - Hora de Fin: 16:00
- [ ] **EDITAR:** Click en turno creado → Modificar nombre a "Turno Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 14. 🏭 Etapas Producción
**URL:** http://localhost:3000/etapas-produccion

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Etapa" → Llenar formulario:
  - Nombre: Etapa de Prueba
  - Descripción: Descripción de etapa de prueba
  - Orden: 1
- [ ] **EDITAR:** Click en etapa creada → Modificar nombre a "Etapa Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 15. ⏸️ Paradas
**URL:** http://localhost:3000/paradas

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Parada" → Llenar formulario:
  - Motivo: Parada de Prueba
  - Categoría: TECNICA
  - Tipo: PLANIFICADA
- [ ] **EDITAR:** Click en parada creada → Modificar motivo a "Parada Editada"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

### 16. 👥 Usuarios
**URL:** http://localhost:3000/configuracion/usuarios

**Pruebas CRUD:**
- [ ] **CREAR:** Click en "Crear Usuario" → Llenar formulario:
  - Username: usuario_test
  - Email: test@example.com
  - Nombre: Usuario
  - Apellido: Prueba
  - Contraseña: testpass123
- [ ] **EDITAR:** Click en usuario creado → Modificar nombre a "Usuario Editado"
- [ ] **ELIMINAR:** Click en botón eliminar → Confirmar eliminación

## Checklist de Funcionalidades Generales

### Navegación
- [ ] Verificar que todos los enlaces del menú funcionen
- [ ] Probar navegación entre módulos
- [ ] Verificar breadcrumbs (si existen)

### Formularios
- [ ] Validación de campos requeridos
- [ ] Mensajes de error apropiados
- [ ] Confirmación de acciones destructivas
- [ ] Cancelación de formularios

### Listados
- [ ] Paginación funciona correctamente
- [ ] Filtros y búsqueda funcionan
- [ ] Ordenamiento por columnas
- [ ] Acciones en lote (si existen)

### Responsive Design
- [ ] Verificar en pantalla de escritorio
- [ ] Verificar en tablet
- [ ] Verificar en móvil

### Performance
- [ ] Tiempo de carga aceptable
- [ ] No hay errores en consola
- [ ] Animaciones fluidas

## Notas de Prueba

1. **Orden de Pruebas:** Se recomienda probar los módulos en el orden indicado, ya que algunos pueden depender de datos creados en módulos anteriores.

2. **Datos de Prueba:** Usar prefijos "TEST-" para todos los datos de prueba para facilitar su identificación y limpieza posterior.

3. **Limpieza:** Después de las pruebas, eliminar todos los datos de prueba creados.

4. **Errores:** Documentar cualquier error encontrado con capturas de pantalla y pasos para reproducir.

5. **Navegador:** Probar en al menos Chrome y Firefox.

## Reporte de Pruebas

Para cada módulo, documentar:
- ✅ Funcionalidades que funcionan correctamente
- ❌ Funcionalidades que fallan
- 🔧 Problemas encontrados
- 💡 Sugerencias de mejora
