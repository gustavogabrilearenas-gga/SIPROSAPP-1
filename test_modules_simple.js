/**
 * Simple Frontend Module Tester
 * Opens browser and provides step-by-step testing guidance
 */

const puppeteer = require('puppeteer');

class SimpleModuleTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Iniciando pruebas del frontend...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async login() {
    console.log('🔐 Iniciando sesión...');
    try {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
      
      await this.page.type('input[name="username"]', 'admin');
      await this.page.type('input[name="password"]', 'sandz334@');
      await this.page.click('button[type="submit"]');
      
      await this.page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Login exitoso');
      return true;
    } catch (error) {
      console.log('❌ Error en login:', error.message);
      return false;
    }
  }

  async testModule(moduleName, modulePath) {
    console.log(`\n🧪 Probando módulo: ${moduleName}`);
    console.log(`📍 Navegando a: ${this.baseUrl}${modulePath}`);
    
    try {
      await this.page.goto(`${this.baseUrl}${modulePath}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`✅ Módulo ${moduleName} cargado correctamente`);
      console.log('📋 Instrucciones para pruebas manuales:');
      console.log('   1. Busca el botón "Crear" o "Nuevo"');
      console.log('   2. Crea un elemento de prueba');
      console.log('   3. Edita el elemento creado');
      console.log('   4. Elimina el elemento');
      console.log('   5. Presiona ENTER cuando termines las pruebas...');
      
      // Wait for user input
      await this.page.waitForFunction(() => {
        return new Promise(resolve => {
          process.stdin.once('data', () => resolve(true));
        });
      });
      
      return true;
    } catch (error) {
      console.log(`❌ Error en módulo ${moduleName}:`, error.message);
      return false;
    }
  }

  async runTests() {
    await this.init();
    
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ No se pudo iniciar sesión. Abortando pruebas.');
      return;
    }

    const modules = [
      { name: 'Productos', path: '/productos' },
      { name: 'Fórmulas', path: '/formulas' },
      { name: 'Máquinas', path: '/maquinas' },
      { name: 'Lotes', path: '/lotes' },
      { name: 'Mantenimiento', path: '/mantenimiento' },
      { name: 'Incidentes', path: '/incidentes' },
      { name: 'Desviaciones', path: '/desviaciones' },
      { name: 'Control Calidad', path: '/control-calidad' },
      { name: 'KPIs', path: '/kpis' },
      { name: 'Ubicaciones', path: '/ubicaciones' },
      { name: 'Turnos', path: '/turnos' },
      { name: 'Etapas Producción', path: '/etapas-produccion' },
      { name: 'Usuarios', path: '/configuracion/usuarios' }
    ];

    console.log('\n📋 MÓDULOS A PROBAR:');
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.name} - ${this.baseUrl}${module.path}`);
    });

    console.log('\n🎯 Iniciando pruebas...');
    console.log('💡 Para cada módulo, realiza las pruebas CRUD manualmente');
    console.log('💡 Presiona ENTER en la consola cuando termines cada módulo\n');

    for (const module of modules) {
      await this.testModule(module.name, module.path);
    }

    console.log('\n🎉 ¡Pruebas completadas!');
    console.log('📄 Revisa la guía de pruebas manuales en MANUAL_TESTING_GUIDE.md');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests
async function main() {
  const tester = new SimpleModuleTester();
  try {
    await tester.runTests();
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleModuleTester;
