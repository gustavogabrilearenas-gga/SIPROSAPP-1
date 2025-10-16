const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Rutas a precompilar
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

// Crear el directorio .next si no existe
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true });
}

// Precompilar cada ruta
Promise.all(routes.map(route => {
  return new Promise((resolve, reject) => {
    console.log(`📦 Precompilando ruta: ${route}`);
    exec(`npx next build ${route}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error precompilando ${route}:`, error);
        reject(error);
        return;
      }
      console.log(`✅ Ruta ${route} precompilada exitosamente`);
      resolve();
    });
  });
})).then(() => {
  console.log('🎉 Precompilación completada!');
}).catch(error => {
  console.error('💥 Error durante la precompilación:', error);
  process.exit(1);
});