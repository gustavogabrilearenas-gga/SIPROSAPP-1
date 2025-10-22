import { test } from '@playwright/test';

test.describe('Flujos de autenticación', () => {
  test('login exitoso redirige al dashboard', async () => {
    test.skip(true, 'Requiere backend disponible para ejecutar el flujo real.');
  });

  test('login inválido muestra mensaje de error', async () => {
    test.skip(true, 'Requiere backend disponible para ejecutar el flujo real.');
  });

  test('operario no puede acceder a dashboards', async () => {
    test.skip(true, 'Requiere backend disponible para ejecutar el flujo real.');
  });
});
