/**
 * Test script for SIPROSA MES Frontend Modules
 * Tests each module by creating, editing, and deleting elements
 * Credentials: admin / sandz334@
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
  }

  async init() {
    console.log('🚀 Iniciando pruebas del frontend...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
  }

  async login() {
    console.log('🔐 Iniciando sesión...');
    try {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
      
      // Fill login form
      await this.page.type('input[name="username"]', 'admin');
      await this.page.type('input[name="password"]', 'sandz334@');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForNavigation({ timeout: 10000 });
      
      console.log('✅ Login exitoso');
      return true;
    } catch (error) {
      console.log('❌ Error en login:', error.message);
      return false;
    }
  }

  async testModule(moduleName, modulePath, testData) {
    console.log(`\n🧪 Probando módulo: ${moduleName}`);
    const moduleResult = {
      module: moduleName,
      tests: [],
      success: true
    };

    try {
      // Navigate to module
      await this.page.goto(`${this.baseUrl}${modulePath}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test CREATE
      console.log(`  📝 Probando creación en ${moduleName}...`);
      const createResult = await this.testCreate(testData.create);
      moduleResult.tests.push(createResult);

      if (createResult.success) {
        // Test EDIT
        console.log(`  ✏️ Probando edición en ${moduleName}...`);
        const editResult = await this.testEdit(testData.edit);
        moduleResult.tests.push(editResult);

        // Test DELETE
        console.log(`  🗑️ Probando eliminación en ${moduleName}...`);
        const deleteResult = await this.testDelete();
        moduleResult.tests.push(deleteResult);
      }

      // Check if any test failed
      moduleResult.success = moduleResult.tests.every(test => test.success);

    } catch (error) {
      console.log(`❌ Error en módulo ${moduleName}:`, error.message);
      moduleResult.success = false;
      moduleResult.tests.push({
        operation: 'module_error',
        success: false,
        error: error.message
      });
    }

    this.testResults.push(moduleResult);
    return moduleResult;
  }

  async testCreate(createData) {
    try {
      // Look for create button
      const createButton = await this.page.$('button:has-text("Crear"), button:has-text("Nuevo"), button:has-text("Agregar")');
      if (createButton) {
        await createButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fill form fields
        for (const [field, value] of Object.entries(createData)) {
          const input = await this.page.$(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`);
          if (input) {
            await input.type(value);
          }
        }

        // Submit form
        const submitButton = await this.page.$('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")');
        if (submitButton) {
          await submitButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return { operation: 'create', success: true };
      } else {
        return { operation: 'create', success: false, error: 'No create button found' };
      }
    } catch (error) {
      return { operation: 'create', success: false, error: error.message };
    }
  }

  async testEdit(editData) {
    try {
      // Look for edit button or click on first item
      const editButton = await this.page.$('button:has-text("Editar"), .edit-button, [data-testid="edit"]');
      if (editButton) {
        await editButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update form fields
        for (const [field, value] of Object.entries(editData)) {
          const input = await this.page.$(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`);
          if (input) {
            await input.click({ clickCount: 3 }); // Select all
            await input.type(value);
          }
        }

        // Submit form
        const submitButton = await this.page.$('button[type="submit"], button:has-text("Guardar"), button:has-text("Actualizar")');
        if (submitButton) {
          await submitButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return { operation: 'edit', success: true };
      } else {
        return { operation: 'edit', success: false, error: 'No edit button found' };
      }
    } catch (error) {
      return { operation: 'edit', success: false, error: error.message };
    }
  }

  async testDelete() {
    try {
      // Look for delete button
      const deleteButton = await this.page.$('button:has-text("Eliminar"), .delete-button, [data-testid="delete"]');
      if (deleteButton) {
        await deleteButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Confirm deletion if modal appears
        const confirmButton = await this.page.$('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")');
        if (confirmButton) {
          await confirmButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return { operation: 'delete', success: true };
      } else {
        return { operation: 'delete', success: false, error: 'No delete button found' };
      }
    } catch (error) {
      return { operation: 'delete', success: false, error: error.message };
    }
  }

  async runAllTests() {
    await this.init();
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ No se pudo iniciar sesión. Abortando pruebas.');
      return;
    }

    // Define test data for each module
    const testData = {
      productos: {
        create: {
          codigo: 'TEST-PROD-001',
          nombre: 'Producto de Prueba',
          principio_activo: 'Principio Activo Test',
          concentracion: '500mg',
          forma_farmaceutica: 'COMPRIMIDO',
          requiere_cadena_frio: false,
          registro_anmat: 'TEST-ANMAT-001'
        },
        edit: {
          nombre: 'Producto de Prueba Editado'
        }
      },
      formulas: {
        create: {
          nombre: 'Fórmula de Prueba',
          descripcion: 'Descripción de prueba',
          version: '1.0'
        },
        edit: {
          nombre: 'Fórmula de Prueba Editada'
        }
      },
      maquinas: {
        create: {
          nombre: 'Máquina de Prueba',
          codigo: 'MAQ-TEST-001',
          tipo: 'PRODUCCION',
          ubicacion: 'Sala de Producción'
        },
        edit: {
          nombre: 'Máquina de Prueba Editada'
        }
      },
      lotes: {
        create: {
          numero_lote: 'LOTE-TEST-001',
          cantidad_producir: 1000,
          fecha_inicio: '2024-01-01'
        },
        edit: {
          cantidad_producir: 1500
        }
      },
      inventario: {
        create: {
          codigo: 'INV-TEST-001',
          nombre: 'Insumo de Prueba',
          tipo: 'INSUMO',
          unidad_medida: 'KG'
        },
        edit: {
          nombre: 'Insumo de Prueba Editado'
        }
      },
      mantenimiento: {
        create: {
          titulo: 'Orden de Prueba',
          descripcion: 'Descripción de prueba',
          prioridad: 'MEDIA',
          tipo_mantenimiento: 1
        },
        edit: {
          titulo: 'Orden de Prueba Editada'
        }
      },
      incidentes: {
        create: {
          titulo: 'Incidente de Prueba',
          descripcion: 'Descripción de incidente de prueba',
          severidad: 'MEDIA'
        },
        edit: {
          titulo: 'Incidente de Prueba Editado'
        }
      },
      desviaciones: {
        create: {
          titulo: 'Desviación de Prueba',
          descripcion: 'Descripción de desviación de prueba',
          severidad: 'MEDIA'
        },
        edit: {
          titulo: 'Desviación de Prueba Editada'
        }
      },
      'control-calidad': {
        create: {
          nombre: 'Control de Prueba',
          descripcion: 'Descripción de control de prueba',
          tipo: 'FISICO'
        },
        edit: {
          nombre: 'Control de Prueba Editado'
        }
      },
      ubicaciones: {
        create: {
          nombre: 'Ubicación de Prueba',
          codigo: 'UBI-TEST-001',
          descripcion: 'Descripción de ubicación de prueba'
        },
        edit: {
          nombre: 'Ubicación de Prueba Editada'
        }
      },
      turnos: {
        create: {
          nombre: 'Turno de Prueba',
          hora_inicio: '08:00',
          hora_fin: '16:00'
        },
        edit: {
          nombre: 'Turno de Prueba Editado'
        }
      },
      'etapas-produccion': {
        create: {
          nombre: 'Etapa de Prueba',
          descripcion: 'Descripción de etapa de prueba',
          orden: 1
        },
        edit: {
          nombre: 'Etapa de Prueba Editada'
        }
      },
      paradas: {
        create: {
          motivo: 'Parada de Prueba',
          categoria: 'TECNICA',
          tipo: 'PLANIFICADA'
        },
        edit: {
          motivo: 'Parada de Prueba Editada'
        }
      },
      usuarios: {
        create: {
          username: 'usuario_test',
          email: 'test@example.com',
          first_name: 'Usuario',
          last_name: 'Prueba',
          password: 'testpass123'
        },
        edit: {
          first_name: 'Usuario Editado'
        }
      }
    };

    // Test each module
    const modules = [
      { name: 'Productos', path: '/productos' },
      { name: 'Fórmulas', path: '/formulas' },
      { name: 'Máquinas', path: '/maquinas' },
      { name: 'Lotes', path: '/lotes' },
      { name: 'Inventario', path: '/inventario' },
      { name: 'Mantenimiento', path: '/mantenimiento' },
      { name: 'Incidentes', path: '/incidentes' },
      { name: 'Desviaciones', path: '/desviaciones' },
      { name: 'Control Calidad', path: '/control-calidad' },
      { name: 'KPIs', path: '/kpis' },
      { name: 'Ubicaciones', path: '/ubicaciones' },
      { name: 'Turnos', path: '/turnos' },
      { name: 'Etapas Producción', path: '/etapas-produccion' },
      { name: 'Paradas', path: '/paradas' },
      { name: 'Usuarios', path: '/configuracion/usuarios' }
    ];

    for (const module of modules) {
      const dataKey = module.path.replace('/', '').replace('-', '_');
      const testDataForModule = testData[dataKey] || { create: {}, edit: {} };
      await this.testModule(module.name, module.path, testDataForModule);
    }

    // Generate report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(50));
    
    let totalTests = 0;
    let passedTests = 0;
    
    this.testResults.forEach(result => {
      console.log(`\n${result.module}: ${result.success ? '✅' : '❌'}`);
      result.tests.forEach(test => {
        totalTests++;
        if (test.success) passedTests++;
        console.log(`  ${test.operation}: ${test.success ? '✅' : '❌'} ${test.error ? `(${test.error})` : ''}`);
      });
    });

    console.log(`\n📈 ESTADÍSTICAS:`);
    console.log(`Total de pruebas: ${totalTests}`);
    console.log(`Pruebas exitosas: ${passedTests}`);
    console.log(`Pruebas fallidas: ${totalTests - passedTests}`);
    console.log(`Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(2)
      },
      results: this.testResults
    };

    fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Reporte detallado guardado en: test_report.json');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests
async function main() {
  const tester = new FrontendTester();
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = FrontendTester;
