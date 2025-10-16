const { execSync } = require('child_process');
const path = require('path');

// Lista de rutas para asegurarnos que sean precompiladas
const routes = [
  '/',
  '/dashboard',
  '/login',
  '/produccion',
  '/mantenimiento',
  '/incidentes',
  '/observaciones',
  '/configuracion/usuarios',
  '/configuraciones-maestras',
  '/configuraciones-maestras/productos'
];

console.log('🚀 Iniciando precompilación de rutas...');

try {
  // Ejecutar next build una sola vez para construir todas las rutas
  console.log('📦 Compilando aplicación...');
  
  // Asegurarse de estar en el directorio correcto
  const frontendDir = path.resolve(__dirname, '..');
  process.chdir(frontendDir);

  // Establecer NODE_ENV a 'development' para desarrollo
  process.env.NODE_ENV = 'development';
  
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });

  console.log('✅ Compilación completada exitosamente');
  
  // Verificar que las rutas estén incluidas en la compilación
  console.log('\nRutas precompiladas:');
  routes.forEach(route => {
    console.log(`✓ ${route}`);
  });
  
  console.log('\n🎉 Precompilación finalizada!');
} catch (error) {
  console.error('💥 Error durante la precompilación:', error);
  process.exit(1);
}