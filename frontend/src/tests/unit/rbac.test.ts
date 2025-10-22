import { can, mapBackendUser } from '@/lib/rbac';

describe('RBAC permissions', () => {
  it('impide que un operario acceda a dashboards', () => {
    const user = mapBackendUser({ id: 1, username: 'operario', groups: [] });
    expect(can('view', 'dashboard', user)).toBe(false);
  });

  it('permite que un supervisor acceda a dashboards', () => {
    const user = mapBackendUser({ id: 2, username: 'supervisor', groups: ['supervisores'] });
    expect(can('view', 'dashboard', user)).toBe(true);
  });

  it('permite que un admin acceda a dashboards', () => {
    const user = mapBackendUser({ id: 3, username: 'admin', is_superuser: true });
    expect(can('view', 'dashboard', user)).toBe(true);
  });
});
