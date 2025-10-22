import type { User } from '@/types/models'

const hasGroup = (user: User | null | undefined, groupName: string) =>
  Boolean(user?.groups?.some((group) => group.toLowerCase() === groupName.toLowerCase()))

export const isSuperuser = (user: User | null | undefined): boolean => Boolean(user?.is_superuser)

export const isSupervisor = (user: User | null | undefined): boolean => hasGroup(user, 'Supervisor')

export const isOperario = (user: User | null | undefined): boolean => hasGroup(user, 'Operario')

export const canAccessMasterConfig = (user: User | null | undefined): boolean =>
  isSuperuser(user) || isSupervisor(user)

export const canEditMasterConfig = (user: User | null | undefined): boolean => isSuperuser(user)
