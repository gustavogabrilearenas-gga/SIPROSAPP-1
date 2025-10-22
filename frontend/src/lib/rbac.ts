import React, { createContext, useContext } from 'react';

export type Role = 'operario' | 'supervisor' | 'admin';

export type User = {
  id: string;
  name?: string;
  role: Role;
};

const UserContext = createContext<User | undefined>(undefined);

export const UserProvider = UserContext.Provider;

export const useUser = () => useContext(UserContext);

export const mapBackendUser = (me: unknown): User => {
  const payload = me as {
    id?: string | number;
    full_name?: string;
    username?: string;
    is_superuser?: boolean;
    groups?: string[];
  };
  const role: Role = payload?.is_superuser
    ? 'admin'
    : payload?.groups?.includes('supervisores')
      ? 'supervisor'
      : 'operario';

  return {
    id: String(payload?.id ?? ''),
    name: payload?.full_name ?? payload?.username ?? undefined,
    role,
  };
};

export const hasRole = (user: User | undefined, role: Role) => !!user && user.role === role;

export const atLeast = (user: User | undefined, role: Exclude<Role, 'operario'>) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'supervisor') return role === 'supervisor';
  return false;
};

export const can = (action: 'view', resource: 'dashboard', user?: User) => {
  if (!user) return false;
  if (resource === 'dashboard' && action === 'view') {
    return user.role !== 'operario';
  }
  return false;
};

type OnlyProps = {
  role?: Role;
  can?: { action: 'view'; resource: 'dashboard' };
  user?: User;
  children: React.ReactNode;
};

export const Only: React.FC<OnlyProps> = ({ role, can: permission, user, children }) => {
  const contextUser = useUser();
  const currentUser = user ?? contextUser;

  if (role && !hasRole(currentUser, role)) {
    return null;
  }

  if (permission && !can(permission.action, permission.resource, currentUser ?? undefined)) {
    return null;
  }

  return <>{children}</>;
};
