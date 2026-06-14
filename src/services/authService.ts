import type { User, RoleType, PermissionType } from '@/types'
import { PERMISSIONS_BY_ROLE, ROLE_LABELS } from '@/types'

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', name: '张主任', role: 'admin', password: '123456', createdAt: '2026-03-01', lastLoginAt: '2026-06-10 09:15' },
  { id: 'u2', username: 'pharmacist1', name: '李药师', role: 'pharmacist', password: '123456', createdAt: '2026-03-01', lastLoginAt: '2026-06-11 08:30' },
  { id: 'u3', username: 'pharmacist2', name: '王药师', role: 'pharmacist', password: '123456', createdAt: '2026-03-01', lastLoginAt: '2026-06-11 09:00' },
  { id: 'u4', username: 'cashier1', name: '赵收费', role: 'cashier', password: '123456', createdAt: '2026-03-01', lastLoginAt: '2026-06-11 08:00' },
  { id: 'u5', username: 'viewer1', name: '孙审计', role: 'viewer', password: '123456', createdAt: '2026-03-01', lastLoginAt: '2026-06-09 14:20' },
]

const CURRENT_USER_KEY = 'pharmacy_current_user'

export class AuthService {
  private currentUser: User | null = null
  private listeners: Array<(user: User | null) => void> = []

  constructor() {
    const saved = localStorage.getItem(CURRENT_USER_KEY)
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved)
      } catch {
        this.currentUser = null
      }
    } else {
      this.currentUser = MOCK_USERS[1]
      this.persist()
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  requireCurrentUser(): User {
    if (!this.currentUser) {
      throw new Error('用户未登录')
    }
    return this.currentUser
  }

  setCurrentUser(user: User) {
    this.currentUser = user
    this.persist()
    this.notifyListeners()
  }

  listUsers(): User[] {
    return MOCK_USERS
  }

  switchUser(userId: string): User | null {
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (user) {
      this.setCurrentUser({ ...user, lastLoginAt: new Date().toLocaleString('zh-CN') })
    }
    return user
  }

  getRole(): RoleType | null {
    return this.currentUser?.role ?? null
  }

  hasPermission(permission: PermissionType): boolean {
    if (!this.currentUser) return false
    const perms = PERMISSIONS_BY_ROLE[this.currentUser.role]
    return perms.includes(permission)
  }

  requirePermission(permission: PermissionType): void {
    if (!this.hasPermission(permission)) {
      const user = this.currentUser
      const role = user ? ROLE_LABELS[user.role] : '未登录'
      throw new Error(`权限不足：当前角色「${role}」不允许执行此操作`)
    }
  }

  hasAnyPermission(permissions: PermissionType[]): boolean {
    return permissions.some((p) => this.hasPermission(p))
  }

  getPermissions(): PermissionType[] {
    if (!this.currentUser) return []
    return [...PERMISSIONS_BY_ROLE[this.currentUser.role]]
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.currentUser))
  }

  private persist() {
    if (this.currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }
}

export const authService = new AuthService()
