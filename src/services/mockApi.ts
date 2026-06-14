import { db, today, daysFromNow } from './mockDatabase'
import type {
  User, Patient, Drug, Prescription, PrescriptionItem,
  ShortageRecord, SubstituteRecord, Reminder, Notification,
  WaitQueueEntry, AuditLog, StockChangeLog,
  ReminderStatus, RoleType, PermissionType,
  AuditActionType, StockChangeReason,
} from '@/types'
import { hasPermission } from '@/types'

class ApiError extends Error {
  constructor(message: string, public code = 400) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiContext {
  currentUser: User | null
}

const _ctx: ApiContext = { currentUser: null }

function getCtx(): ApiContext {
  const raw = localStorage.getItem('pharmacy_current_user')
  if (raw) {
    try { _ctx.currentUser = JSON.parse(raw) as User } catch { _ctx.currentUser = null }
  }
  return _ctx
}

function setCtxUser(u: User | null) {
  _ctx.currentUser = u
  if (u) localStorage.setItem('pharmacy_current_user', JSON.stringify(u))
  else localStorage.removeItem('pharmacy_current_user')
}

function requirePermission(p: PermissionType) {
  const ctx = getCtx()
  if (!ctx.currentUser) throw new ApiError('未登录', 401)
  if (!hasPermission(ctx.currentUser.role, p)) throw new ApiError('无操作权限', 403)
}

function operatorInfo(): { operator: string; operatorRole: RoleType } {
  const ctx = getCtx()
  return { operator: ctx.currentUser?.id ?? 'system', operatorRole: ctx.currentUser?.role ?? 'viewer' }
}

function calcChanges<T extends Record<string, unknown>>(before: T | null, after: T | null): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  const keys = new Set<string>()
  if (before) Object.keys(before).forEach((k) => keys.add(k))
  if (after) Object.keys(after).forEach((k) => keys.add(k))
  keys.forEach((k) => {
    const b = before?.[k]
    const a = after?.[k]
    if (JSON.stringify(b) !== JSON.stringify(a)) changes[k] = { before: b ?? null, after: a ?? null }
  })
  return changes
}

async function writeAudit(action: AuditActionType, entityType: AuditLog['entityType'], entityId: string, before: unknown | null, after: unknown | null, details: string) {
  const { operator, operatorRole } = operatorInfo()
  const changes = calcChanges(before as Record<string, unknown> | null, after as Record<string, unknown> | null)
  await db.createAuditLog({
    action, entityType, entityId, operator, operatorRole,
    beforeSnapshot: before, afterSnapshot: after, changes,
    ip: '127.0.0.1', userAgent: navigator.userAgent,
    createdAt: new Date().toISOString(), details,
  })
}

async function writeStockChange(drugId: string, changeQty: number, reason: StockChangeReason, referenceId: string, notes: string) {
  const drugs = await db.getDrugs()
  const d = drugs.find((x) => x.id === drugId)
  if (!d) return
  const before = d.stock
  const after = before + changeQty
  const { operator } = operatorInfo()
  await db.createStockChangeLog({
    drugId, changeQuantity: changeQty, beforeStock: before, afterStock: after,
    reason, operator, referenceId, notes, createdAt: new Date().toISOString(),
  })
}

// ---------- Auth ----------
export const authApi = {
  async login(username: string, password: string): Promise<User> {
    const user = await db.findUserByUsername(username)
    if (!user || user.password !== password) throw new ApiError('用户名或密码错误')
    setCtxUser(user)
    await writeAudit('user_login', 'user', user.id, null, { id: user.id, role: user.role }, `${user.name}登录系统`)
    return { ...user }
  },
  async logout(): Promise<void> {
    const u = getCtx().currentUser
    if (u) await writeAudit('user_logout', 'user', u.id, null, null, `${u.name}登出系统`)
    setCtxUser(null)
  },
  currentUser(): User | null {
    return getCtx().currentUser ? { ...getCtx().currentUser! } : null
  },
  async restoreSession(): Promise<User | null> {
    const u = getCtx().currentUser
    if (!u) return null
    const fresh = await db.findUserById(u.id)
    if (!fresh) { setCtxUser(null); return null }
    setCtxUser(fresh)
    return { ...fresh }
  },
}

// ---------- Patients ----------
export const patientApi = {
  async list(): Promise<Patient[]> {
    requirePermission('patient:view')
    return db.getPatients()
  },
  async create(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    requirePermission('patient:create')
    if (!data.name.trim()) throw new ApiError('患者姓名不能为空')
    if (!data.phone.trim()) throw new ApiError('手机号不能为空')
    const p = await db.createPatient(data)
    await writeAudit('patient_created', 'patient', p.id, null, { ...p }, `创建患者：${p.name}`)
    return p
  },
  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    requirePermission('patient:edit')
    const list = await db.getPatients()
    const before = list.find((p) => p.id === id)
    const result = await db.updatePatient(id, data)
    if (!result) throw new ApiError('患者不存在')
    await writeAudit('patient_updated', 'patient', id, before ?? null, { ...result }, `更新患者：${result.name}`)
    return result
  },
}

// ---------- Drugs ----------
export const drugApi = {
  async list(): Promise<Drug[]> {
    return db.getDrugs()
  },
  async adjustStock(id: string, delta: number, reason: StockChangeReason, refId = '', notes = ''): Promise<Drug> {
    requirePermission('inventory:adjust')
    const list = await db.getDrugs()
    const before = list.find((d) => d.id === id)
    if (!before) throw new ApiError('药品不存在')
    const newStock = Math.max(0, before.stock + delta)
    const result = await db.updateDrug(id, { stock: newStock })
    if (!result) throw new ApiError('更新失败')
    await writeStockChange(id, delta, reason, refId, notes || reason)
    await writeAudit('drug_stock_adjusted', 'drug', id, { ...before }, { ...result }, `调整库存 ${before.stock}→${newStock}`)
    return result
  },
}

// ---------- Prescriptions ----------
export const prescriptionApi = {
  async list(): Promise<Prescription[]> {
    requirePermission('prescription:view')
    return db.getPrescriptions()
  },

  async create(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'registeredBy'> & { items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[] }): Promise<Prescription> {
    requirePermission('prescription:create')
    if (!data.patientId) throw new ApiError('请选择患者')
    if (data.items.length === 0) throw new ApiError('请添加至少一种药品')

    const drugs = await db.getDrugs()
    for (const it of data.items) {
      const d = drugs.find((x) => x.id === it.drugId)
      if (!d) throw new ApiError(`药品不存在`)
      if (d.stock < it.quantity) throw new ApiError(`${d.name}库存不足（当前${d.stock}${d.unit}，需${it.quantity}${d.unit}）`)
      if (d.stock === 0) throw new ApiError(`${d.name}已缺货`)
    }

    const ctx = getCtx()
    const rx = await db.createPrescription({ ...data, registeredBy: ctx.currentUser?.id ?? '' })

    for (const it of data.items) {
      await drugApi.adjustStock(it.drugId, -it.quantity, 'prescription_dispense', rx.id, `处方${rx.id}发药`)
      await writeAudit('inventory_deducted', 'drug', it.drugId, null, { prescriptionId: rx.id, qty: -it.quantity }, `处方发药扣减库存 -${it.quantity}`)
    }

    const remainingDays = data.remainingDays
    const patients = await db.getPatients()
    const patient = patients.find((p) => p.id === data.patientId)
    const reminders: Array<{ type: 'renewal_7d' | 'renewal_3d' | 'renewal_1d'; offset: number; msg: string }> = []
    if (remainingDays >= 7) reminders.push({ type: 'renewal_7d', offset: remainingDays - 7, msg: `${patient?.name || '患者'}的处方将在7天后到期，请提前联系续方` })
    if (remainingDays >= 3) reminders.push({ type: 'renewal_3d', offset: remainingDays - 3, msg: `${patient?.name || '患者'}的处方将在3天内到期，请尽快联系续方` })
    if (remainingDays >= 1) reminders.push({ type: 'renewal_1d', offset: remainingDays - 1, msg: `${patient?.name || '患者'}的处方即将到期，请立即联系续方！` })
    for (const r of reminders) {
      await db.createReminder({
        patientId: data.patientId, prescriptionId: rx.id, shortageId: '',
        type: r.type, remindDate: daysFromNow(r.offset), status: 'pending', message: r.msg,
        retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '',
      })
    }

    await writeAudit('prescription_created', 'prescription', rx.id, null, { id: rx.id, patientId: rx.patientId, items: rx.items.length }, `创建处方 ${rx.id}，患者${patient?.name || ''}，${rx.items.length}种药品`)
    return rx
  },

  async update(id: string, data: Partial<Prescription>): Promise<Prescription> {
    requirePermission('prescription:edit')
    const list = await db.getPrescriptions()
    const before = list.find((p) => p.id === id)
    const result = await db.updatePrescription(id, data)
    if (!result) throw new ApiError('处方不存在')
    await writeAudit('prescription_updated', 'prescription', id, before ?? null, { ...result }, `更新处方 ${id}`)
    return result
  },
}

// ---------- Shortages ----------
export const shortageApi = {
  async list(): Promise<ShortageRecord[]> {
    requirePermission('prescription:view')
    return db.getShortages()
  },

  async register(data: Omit<ShortageRecord, 'id' | 'substitutes' | 'createdAt' | 'registeredBy'>): Promise<ShortageRecord> {
    requirePermission('shortage:create')
    if (!data.drugId) throw new ApiError('请选择缺货药品')
    if (data.shortageQuantity <= 0) throw new ApiError('缺货数量必须大于0')

    const list = await db.getShortages()
    const existing = list.find((s) => s.drugId === data.drugId && s.status !== 'restocked')
    if (existing) throw new ApiError('该药品已有未处理的缺货记录')

    const ctx = getCtx()
    const drugs = await db.getDrugs()
    const drug = drugs.find((d) => d.id === data.drugId)
    const before = drug ? { ...drug } : null

    const s = await db.createShortage({ ...data, registeredBy: ctx.currentUser?.id ?? '' })

    if (drug && drug.stock > 0) {
      await drugApi.adjustStock(drug.id, -drug.stock, 'shortage_register', s.id, `缺货登记，库存清零`)
    }

    const prescriptions = await db.getPrescriptions()
    const affectedPatientIds = new Set<string>()
    prescriptions.forEach((rx) => {
      if (rx.status !== 'active') return
      rx.items.forEach((it) => {
        if (it.drugId === data.drugId) affectedPatientIds.add(rx.patientId)
      })
    })
    let pos = 1
    for (const pid of Array.from(affectedPatientIds)) {
      const entry = await db.addWaitQueueEntry({ shortageId: s.id, patientId: pid, status: 'waiting', position: pos++, notifiedAt: '', servedAt: '' })
      await writeAudit('waitqueue_joined', 'waitqueue', entry.id, null, { ...entry }, `患者${pid}加入等待队列`)
    }

    await writeAudit('shortage_registered', 'shortage', s.id, before, { id: s.id, drugId: s.drugId, qty: s.shortageQuantity }, `登记缺货：${drug?.name || '药品'}`)
    return s
  },

  async addSubstitute(shortageId: string, data: Omit<SubstituteRecord, 'id' | 'shortageId' | 'createdAt' | 'registeredBy'>): Promise<ShortageRecord> {
    requirePermission('shortage:edit')
    if (!data.substituteDrugId) throw new ApiError('请选择替代药品')
    if (!data.reason.trim()) throw new ApiError('请填写替代原因')

    const ctx = getCtx()
    const list = await db.getShortages()
    const before = list.find((s) => s.id === shortageId)
    const result = await db.addSubstitute(shortageId, { ...data, registeredBy: ctx.currentUser?.id ?? '' })
    if (!result) throw new ApiError('缺货记录不存在')

    const drugs = await db.getDrugs()
    const origDrug = drugs.find((d) => d.id === before?.drugId)
    const subDrug = drugs.find((d) => d.id === data.substituteDrugId)

    for (const pid of data.patientIds) {
      await db.createReminder({
        patientId: pid, prescriptionId: '', shortageId,
        type: 'substitute_notice', remindDate: today(), status: 'pending',
        message: `${origDrug?.name || '药品'}缺货，替代方案：${subDrug?.name || '药品'}，原因：${data.reason}`,
        retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '',
      })
    }

    await writeAudit('shortage_substituted', 'shortage', shortageId, before ?? null, { ...result }, `替代方案：${origDrug?.name} → ${subDrug?.name}`)
    return result
  },

  async restock(id: string): Promise<ShortageRecord> {
    requirePermission('shortage:restock')
    const list = await db.getShortages()
    const before = list.find((s) => s.id === id)
    if (!before) throw new ApiError('缺货记录不存在')

    const drugs = await db.getDrugs()
    const drug = drugs.find((d) => d.id === before.drugId)
    if (drug) await drugApi.adjustStock(drug.id, before.shortageQuantity, 'restock_arrival', id, `到货入库${before.shortageQuantity}${drug.unit}`)

    const waitQueue = await db.getWaitQueue()
    const affectedEntries = waitQueue.filter((w) => w.shortageId === id && w.status !== 'served')
    for (const w of affectedEntries) {
      await db.updateWaitQueueEntry(w.id, { status: 'notified', notifiedAt: today() })
      await db.createReminder({
        patientId: w.patientId, prescriptionId: '', shortageId: id,
        type: 'shortage_arrival', remindDate: today(), status: 'pending',
        message: `${drug?.name || '药品'}已到货，请通知患者前来取药`,
        retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '',
      })
      await writeAudit('waitqueue_served', 'waitqueue', w.id, { ...w }, { ...w, status: 'notified' }, `到货通知已发送`)
    }

    const result = await db.updateShortage(id, { status: 'restocked' })
    if (!result) throw new ApiError('更新失败')
    await writeAudit('shortage_restocked', 'shortage', id, { ...before }, { ...result }, `确认到货：${drug?.name}，入库${before.shortageQuantity}${drug?.unit}`)
    await writeAudit('inventory_restocked', 'drug', before.drugId, null, { shortageId: id, qty: before.shortageQuantity }, `入库库存 +${before.shortageQuantity}`)
    return result
  },
}

// ---------- Reminders ----------
export const reminderApi = {
  async list(): Promise<Reminder[]> {
    requirePermission('prescription:view')
    return db.getReminders()
  },

  async send(id: string): Promise<Reminder> {
    requirePermission('reminder:send')
    const list = await db.getReminders()
    const before = list.find((r) => r.id === id)
    if (!before) throw new ApiError('提醒不存在')
    if (before.status === 'confirmed' || before.status === 'ignored') throw new ApiError('该提醒无需发送')

    await db.updateReminder(id, { status: 'sending' })

    let sent = false
    let lastError = ''
    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await new Promise((r) => setTimeout(r, 600 + attempt * 400))
      const success = Math.random() > 0.1
      if (success) { sent = true; break }
      lastError = `第${attempt + 1}次发送失败`
    }

    let finalStatus: ReminderStatus
    if (sent) {
      finalStatus = 'sent'
      const patients = await db.getPatients()
      const patient = patients.find((p) => p.id === before.patientId)
      const notif: Omit<Notification, 'id'> = {
        reminderId: id, patientId: before.patientId, channel: 'sms',
        recipient: patient?.phone || '', content: before.message, status: 'sent',
        retryCount: 0, lastAttemptAt: today(), errorMessage: '',
      }
      await db.createNotification(notif)
      await writeAudit('notification_sent', 'notification', id, null, { ...notif }, `短信通知已发送`)
      await writeAudit('reminder_sent', 'reminder', id, { ...before }, { ...before, status: 'sent' }, `发送提醒成功`)
    } else {
      finalStatus = 'failed'
      await writeAudit('reminder_failed', 'reminder', id, { ...before }, { ...before, status: 'failed', lastSentAt: today() }, `发送提醒失败：${lastError}`)
    }

    const retryCount = before.retryCount + 1
    const result = await db.updateReminder(id, {
      status: finalStatus,
      retryCount,
      lastSentAt: today(),
    })
    if (!result) throw new ApiError('更新失败')
    return result
  },

  async confirm(id: string): Promise<Reminder> {
    requirePermission('reminder:confirm')
    const list = await db.getReminders()
    const before = list.find((r) => r.id === id)
    if (!before) throw new ApiError('提醒不存在')
    const ctx = getCtx()
    const result = await db.updateReminder(id, { status: 'confirmed', confirmedBy: ctx.currentUser?.id ?? '', confirmedAt: today() })
    if (!result) throw new ApiError('更新失败')
    await writeAudit('reminder_confirmed', 'reminder', id, { ...before }, { ...result }, `确认回执`)
    return result
  },

  async ignore(id: string): Promise<Reminder> {
    requirePermission('reminder:send')
    const list = await db.getReminders()
    const before = list.find((r) => r.id === id)
    if (!before) throw new ApiError('提醒不存在')
    const result = await db.updateReminder(id, { status: 'ignored' })
    if (!result) throw new ApiError('更新失败')
    await writeAudit('reminder_ignored', 'reminder', id, { ...before }, { ...result }, `忽略提醒`)
    return result
  },
}

// ---------- Wait Queue ----------
export const waitQueueApi = {
  async list(): Promise<WaitQueueEntry[]> {
    requirePermission('prescription:view')
    return db.getWaitQueue()
  },
}

// ---------- Audit ----------
export const auditApi = {
  async list(): Promise<AuditLog[]> {
    requirePermission('audit:view')
    return db.getAuditLogs()
  },
}

// ---------- Stock Change ----------
export const stockApi = {
  async listChanges(): Promise<StockChangeLog[]> {
    requirePermission('audit:view')
    return db.getStockChangeLogs()
  },
}

// ---------- Notifications ----------
export const notificationApi = {
  async list(): Promise<Notification[]> {
    requirePermission('prescription:view')
    return db.getNotifications()
  },
}

export { ApiError }
export type { ApiContext }
