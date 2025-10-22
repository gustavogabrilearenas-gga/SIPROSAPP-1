import { test, expect } from '@playwright/test';

type Creds = { user: string; pass: string };
function readCreds(prefix: string): Creds | null {
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASS`];
  if (!user || !pass) return null;
  return { user, pass };
}

const OP = readCreds('E2E_OPERARIO');
const SV = readCreds('E2E_SUPERVISOR');
const AD = readCreds('E2E_ADMIN');

test.describe('Autenticación y permisos', () => {
  test('login válido (operario) y restricción de /dashboards', async ({ page }) => {
    test.skip(!OP, 'Faltan credenciales E2E_OPERARIO_USER/PASS');
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(OP!.user);
    await page.getByLabel(/password/i).fill(OP!.pass);
    await page.getByRole('button', { name: /ingresar|login/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/dashboards');
    await expect(page.getByText(/No autorizado/i)).toBeVisible();
  });

  test('supervisor ve /dashboards', async ({ page }) => {
    test.skip(!SV, 'Faltan credenciales E2E_SUPERVISOR_USER/PASS');
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(SV!.user);
    await page.getByLabel(/password/i).fill(SV!.pass);
    await page.getByRole('button', { name: /ingresar|login/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/dashboards');
    await expect(page.getByRole('heading', { name: /dashboards/i })).toBeVisible();
  });

  test('admin accede a /admin/*', async ({ page }) => {
    test.skip(!AD, 'Faltan credenciales E2E_ADMIN_USER/PASS');
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(AD!.user);
    await page.getByLabel(/password/i).fill(AD!.pass);
    await page.getByRole('button', { name: /ingresar|login/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/admin/usuarios');
    await expect(page.getByRole('heading', { name: /usuarios/i })).toBeVisible();
    await page.goto('/admin/catalogos');
    await expect(page.getByRole('heading', { name: /catálogos/i })).toBeVisible();
  });
});
