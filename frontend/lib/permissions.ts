export type Role = 'social_worker' | 'manager' | 'admin'
export type Permission = `${string}:${string}`

export const rolePermissions: Record<Role, Permission[]> = {
  social_worker: ['transcription:read', 'transcription:write', 'minutes:read'],
  manager: ['transcription:read', 'transcription:write', 'minutes:read', 'minutes:approve'],
  admin: ['admin:*', 'minutes:read', 'transcription:read', 'transcription:write'],
}

export function hasPermission(required: Permission[] | undefined, role: Role): boolean {
  if (!required || required.length === 0) return true
  const perms = rolePermissions[role] ?? []
  return required.every((p) => {
    const wildcard = `${p.split(':')[0]}:*` as Permission
    return perms.includes(p) || perms.includes(wildcard)
  })
}
