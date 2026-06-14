import type { AuditLog, AuditActionType, User, RoleType } from '@/types'

const STORAGE_KEY = 'pharmacy_audit_logs'
const MAX_LOGS = 1000

function genId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function snapshot<T>(obj: T): Record<string, unknown> | undefined {
  if (obj == null) return undefined
  try {
    return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function calcChanges(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  const keys = new Set<string>()
  if (before) Object.keys(before).forEach((k) => keys.add(k))
  if (after) Object.keys(after).forEach((k) => keys.add(k))
  keys.forEach((k) => {
    const b = before?.[k]
    const a = after?.[k]
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes[k] = { before: b ?? null, after: a ?? null }
    }
  })
  return changes
}

class AuditService {
  private logs: AuditLog[] = []

  constructor() {
    this.load()
  }

  private load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        this.logs = JSON.parse(raw)
      } catch {
        this.logs = []
      }
    }
  }

  private save() {
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs))
  }

  list(): AuditLog[] {
    return [...this.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  record<T>(params: {
    action: AuditActionType
    entityType: AuditLog['entityType']
    entityId: string
    operator: User | null
    operatorRoleOverride?: RoleType
    before: T | null
    after: T | null
    details?: string
  }): AuditLog {
    const beforeSnap = snapshot(params.before)
    const afterSnap = snapshot(params.after)
    const log: AuditLog = {
      id: genId(),
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      operator: params.operator?.id ?? 'system',
      operatorRole: params.operatorRoleOverride ?? params.operator?.role ?? 'viewer',
      beforeSnapshot: beforeSnap ?? null,
      afterSnapshot: afterSnap ?? null,
      changes: calcChanges(beforeSnap, afterSnap),
      ip: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      createdAt: new Date().toISOString(),
      details: params.details ?? '',
    }
    this.logs.unshift(log)
    this.save()
    return log
  }

  clear() {
    this.logs = []
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const auditService = new AuditService()
export type { AuditActionType, RoleType }
