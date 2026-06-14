import { usePharmacyStore } from '@/store/usePharmacyStore'
import type { PermissionType } from '@/types'

export function usePermissions() {
  const currentUser = usePharmacyStore((s) => s.currentUser)
  const role = currentUser?.role ?? null

  const can = (permission: PermissionType): boolean => {
    if (!role) return false
    return usePharmacyStore.getState().hasPermission(permission)
  }

  const canAll = (permissions: PermissionType[]): boolean => {
    return permissions.every((p) => can(p))
  }

  const canAny = (permissions: PermissionType[]): boolean => {
    return permissions.some((p) => can(p))
  }

  return { can, canAll, canAny, role, currentUser }
}
