import { create } from 'zustand'
import type {
  User, Patient, Drug, Prescription, PrescriptionItem,
  ShortageRecord, SubstituteRecord, Reminder, AuditLog,
  PermissionType,
} from '@/types'
import { hasPermission } from '@/types'
import {
  authApi, patientApi, drugApi, prescriptionApi, shortageApi,
  reminderApi, waitQueueApi, auditApi, stockApi, notificationApi,
} from '@/services/mockApi'
import { db } from '@/services/mockDatabase'
import { broadcastSync } from '@/services/broadcastSync'
import type { SyncMessage } from '@/services/broadcastSync'
import { useToastStore } from '@/store/useToastStore'

interface LoadingState {
  auth: boolean
  patients: boolean
  drugs: boolean
  prescriptions: boolean
  shortages: boolean
  reminders: boolean
  audit: boolean
  stock: boolean
  queue: boolean
  notifications: boolean
  global: boolean
}

interface ToastShowFn {
  (type: 'success' | 'error' | 'warning' | 'info', message: string): void
}

const showToast: ToastShowFn = (type, message) => {
  const toast = useToastStore.getState()
  toast.show(type, message)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface PharmacyState {
  // ===== 数据 =====
  initialized: boolean
  currentUser: User | null
  patients: Patient[]
  drugs: Drug[]
  prescriptions: Prescription[]
  shortages: ShortageRecord[]
  reminders: Reminder[]
  auditLogs: AuditLog[]
  notifications: Awaited<ReturnType<typeof notificationApi.list>>
  waitQueue: Awaited<ReturnType<typeof waitQueueApi.list>>
  stockChanges: Awaited<ReturnType<typeof stockApi.listChanges>>

  loading: LoadingState

  // ===== 初始化和同步 =====
  init: () => Promise<void>
  loadAll: () => Promise<void>
  loadPatients: () => Promise<void>
  loadDrugs: () => Promise<void>
  loadPrescriptions: () => Promise<void>
  loadShortages: () => Promise<void>
  loadReminders: () => Promise<void>
  loadAuditLogs: () => Promise<void>
  loadNotifications: () => Promise<void>
  loadWaitQueue: () => Promise<void>
  loadStockChanges: () => Promise<void>
  showToast: ToastShowFn

  // ===== 权限 =====
  hasPermission: (p: PermissionType) => boolean
  requirePermission: (p: PermissionType) => void

  // ===== 认证 =====
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  restoreSession: () => Promise<User | null>

  // ===== 患者 =====
  addPatient: (data: Omit<Patient, 'id' | 'createdAt'>) => Promise<string>
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>

  // ===== 库存 =====
  adjustStock: (id: string, delta: number, reason: Parameters<typeof drugApi.adjustStock>[2], refId?: string, notes?: string) => Promise<void>

  // ===== 处方 =====
  addPrescription: (data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'registeredBy'> & { items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[] }) => Promise<string>
  updatePrescription: (id: string, data: Partial<Prescription>) => Promise<void>
  completePrescription: (id: string) => Promise<void>

  // ===== 缺货 =====
  addShortage: (data: Omit<ShortageRecord, 'id' | 'substitutes' | 'createdAt' | 'registeredBy'>) => Promise<string>
  addSubstitute: (shortageId: string, sub: Omit<SubstituteRecord, 'id' | 'shortageId' | 'createdAt' | 'registeredBy'>) => Promise<void>
  restockShortage: (shortageId: string) => Promise<void>

  // ===== 提醒 =====
  sendReminder: (id: string) => Promise<void>
  confirmReminder: (id: string) => Promise<void>
  ignoreReminder: (id: string) => Promise<void>

  // ===== 系统 =====
  resetAllData: () => Promise<void>

  // ===== 派生查询 =====
  getPatient: (id: string) => Patient | undefined
  getDrug: (id: string) => Drug | undefined
  getPrescriptionsByPatient: (patientId: string) => Prescription[]
  getPatientReminders: (patientId: string) => Reminder[]
  getShortagesByDrug: (drugId: string) => ShortageRecord[]
  getTodayPickups: () => Prescription[]
  getUrgentReminders: () => Reminder[]
  getActiveShortages: () => ShortageRecord[]
  getPendingReminders: () => Reminder[]
}

const initialLoading: LoadingState = {
  auth: false,
  patients: false,
  drugs: false,
  prescriptions: false,
  shortages: false,
  reminders: false,
  audit: false,
  stock: false,
  queue: false,
  notifications: false,
  global: false,
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  initialized: false,
  currentUser: null,
  patients: [],
  drugs: [],
  prescriptions: [],
  shortages: [],
  reminders: [],
  auditLogs: [],
  notifications: [],
  waitQueue: [],
  stockChanges: [],
  loading: { ...initialLoading },
  showToast,

  hasPermission: (p) => {
    const u = get().currentUser
    if (!u) return false
    return hasPermission(u.role, p)
  },
  requirePermission: (p) => {
    if (!get().hasPermission(p)) {
      const u = get().currentUser
      throw new Error(u ? `无操作权限：${p}` : '请先登录')
    }
  },

  // ===== 初始化 =====
  init: async () => {
    broadcastSync.connect()
    broadcastSync.subscribe((msg: SyncMessage) => {
      if (msg.action === 'data:updated' || msg.action === 'data:reset') {
        setTimeout(() => get().loadAll(), 200)
      }
      if (msg.action === 'user:login' && get().currentUser) {
        broadcastSync.broadcast('user:logout')
        set({ currentUser: null })
        showToast('warning', '账号在其他窗口登录，当前已退出')
      }
    })
    await db.init()
    const user = await get().restoreSession()
    if (user) {
      await get().loadAll()
    }
    set({ initialized: true })
  },

  loadAll: async () => {
    set((s) => ({ loading: { ...s.loading, global: true } }))
    try {
      await Promise.all([
        get().loadPatients(),
        get().loadDrugs(),
        get().loadPrescriptions(),
        get().loadShortages(),
        get().loadReminders(),
        get().loadWaitQueue(),
        get().loadNotifications(),
      ])
    } finally {
      set((s) => ({ loading: { ...s.loading, global: false } }))
    }
  },

  loadPatients: async () => {
    set((s) => ({ loading: { ...s.loading, patients: true } }))
    try {
      const list = await patientApi.list()
      set({ patients: list })
    } catch {
      /* ignore 权限错误 */
    } finally {
      set((s) => ({ loading: { ...s.loading, patients: false } }))
    }
  },
  loadDrugs: async () => {
    set((s) => ({ loading: { ...s.loading, drugs: true } }))
    try {
      const list = await drugApi.list()
      set({ drugs: list })
    } finally {
      set((s) => ({ loading: { ...s.loading, drugs: false } }))
    }
  },
  loadPrescriptions: async () => {
    set((s) => ({ loading: { ...s.loading, prescriptions: true } }))
    try {
      const list = await prescriptionApi.list()
      set({ prescriptions: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, prescriptions: false } }))
    }
  },
  loadShortages: async () => {
    set((s) => ({ loading: { ...s.loading, shortages: true } }))
    try {
      const list = await shortageApi.list()
      set({ shortages: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, shortages: false } }))
    }
  },
  loadReminders: async () => {
    set((s) => ({ loading: { ...s.loading, reminders: true } }))
    try {
      const list = await reminderApi.list()
      set({ reminders: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, reminders: false } }))
    }
  },
  loadAuditLogs: async () => {
    set((s) => ({ loading: { ...s.loading, audit: true } }))
    try {
      const list = await auditApi.list()
      set({ auditLogs: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, audit: false } }))
    }
  },
  loadNotifications: async () => {
    set((s) => ({ loading: { ...s.loading, notifications: true } }))
    try {
      const list = await notificationApi.list()
      set({ notifications: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, notifications: false } }))
    }
  },
  loadWaitQueue: async () => {
    set((s) => ({ loading: { ...s.loading, queue: true } }))
    try {
      const list = await waitQueueApi.list()
      set({ waitQueue: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, queue: false } }))
    }
  },
  loadStockChanges: async () => {
    set((s) => ({ loading: { ...s.loading, stock: true } }))
    try {
      const list = await stockApi.listChanges()
      set({ stockChanges: list })
    } catch {
      /* ignore */
    } finally {
      set((s) => ({ loading: { ...s.loading, stock: false } }))
    }
  },

  // ===== 认证 =====
  login: async (username, password) => {
    set((s) => ({ loading: { ...s.loading, auth: true } }))
    try {
      const u = await authApi.login(username, password)
      set({ currentUser: u })
      broadcastSync.broadcast('user:login')
      await get().loadAll()
      showToast('success', `欢迎回来，${u.name}！`)
      return u
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '登录失败')
      throw e
    } finally {
      set((s) => ({ loading: { ...s.loading, auth: false } }))
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
      set({ currentUser: null })
      broadcastSync.broadcast('user:logout')
      showToast('info', '已安全退出系统')
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '退出失败')
    }
  },

  restoreSession: async () => {
    set((s) => ({ loading: { ...s.loading, auth: true } }))
    try {
      const u = await authApi.restoreSession()
      if (u) set({ currentUser: u })
      return u
    } finally {
      set((s) => ({ loading: { ...s.loading, auth: false } }))
    }
  },

  // ===== 患者 =====
  addPatient: async (data) => {
    const p = await patientApi.create(data)
    await get().loadPatients()
    broadcastSync.broadcast('data:updated')
    showToast('success', `已添加患者：${p.name}`)
    return p.id
  },
  updatePatient: async (id, data) => {
    await patientApi.update(id, data)
    await get().loadPatients()
    broadcastSync.broadcast('data:updated')
    showToast('success', '患者信息已更新')
  },

  // ===== 库存 =====
  adjustStock: async (id, delta, reason, refId, notes) => {
    await drugApi.adjustStock(id, delta, reason, refId, notes)
    await get().loadDrugs()
    await get().loadStockChanges()
    broadcastSync.broadcast('data:updated')
  },

  // ===== 处方 =====
  addPrescription: async (data) => {
    const rx = await prescriptionApi.create(data)
    await Promise.all([get().loadPrescriptions(), get().loadDrugs(), get().loadReminders(), get().loadStockChanges()])
    broadcastSync.broadcast('data:updated')
    showToast('success', `处方${rx.id}已登记，已扣减库存并生成续方提醒`)
    return rx.id
  },
  updatePrescription: async (id, data) => {
    await prescriptionApi.update(id, data)
    await get().loadPrescriptions()
    broadcastSync.broadcast('data:updated')
    showToast('success', '处方已更新')
  },
  completePrescription: async (id) => {
    await get().updatePrescription(id, { status: 'completed' as const })
    showToast('success', '处方已标记完成')
  },

  // ===== 缺货 =====
  addShortage: async (data) => {
    const s = await shortageApi.register(data)
    await Promise.all([get().loadShortages(), get().loadDrugs(), get().loadWaitQueue(), get().loadStockChanges()])
    broadcastSync.broadcast('data:updated')
    const d = get().getDrug(data.drugId)
    showToast('warning', `已登记缺货：${d?.name || '药品'}，已加入${get().waitQueue.filter((w) => w.shortageId === s.id).length}位患者等待队列`)
    return s.id
  },
  addSubstitute: async (shortageId, sub) => {
    await shortageApi.addSubstitute(shortageId, sub)
    await Promise.all([get().loadShortages(), get().loadReminders()])
    broadcastSync.broadcast('data:updated')
    showToast('success', `已登记替代方案，已通知${sub.patientIds.length}位患者`)
  },
  restockShortage: async (shortageId) => {
    const before = get().shortages.find((s) => s.id === shortageId)
    await shortageApi.restock(shortageId)
    await Promise.all([get().loadShortages(), get().loadDrugs(), get().loadReminders(), get().loadWaitQueue(), get().loadStockChanges()])
    broadcastSync.broadcast('data:updated')
    const d = before ? get().getDrug(before.drugId) : null
    showToast('success', `${d?.name || '药品'}已到货入库，已发送${before?.shortageQuantity || ''}份到货通知`)
  },

  // ===== 提醒 =====
  sendReminder: async (id) => {
    set((s) => ({ loading: { ...s.loading, reminders: true } }))
    try {
      const r = await reminderApi.send(id)
      await Promise.all([get().loadReminders(), get().loadNotifications()])
      broadcastSync.broadcast('data:updated')
      if (r.status === 'sent') {
        showToast('success', '提醒已发送')
      } else if (r.status === 'failed') {
        showToast('error', '提醒发送失败，请稍后重试')
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '发送失败')
    } finally {
      set((s) => ({ loading: { ...s.loading, reminders: false } }))
    }
  },
  confirmReminder: async (id) => {
    await reminderApi.confirm(id)
    await get().loadReminders()
    broadcastSync.broadcast('data:updated')
    showToast('success', '已确认回执')
  },
  ignoreReminder: async (id) => {
    await reminderApi.ignore(id)
    await get().loadReminders()
    broadcastSync.broadcast('data:updated')
    showToast('info', '已忽略该提醒')
  },

  // ===== 系统 =====
  resetAllData: async () => {
    get().requirePermission('system:manage')
    await db.reset()
    broadcastSync.broadcast('data:reset')
    await get().loadAll()
    showToast('success', '系统数据已重置为初始状态')
  },

  // ===== 查询 =====
  getPatient: (id) => get().patients.find((p) => p.id === id),
  getDrug: (id) => get().drugs.find((d) => d.id === id),
  getPrescriptionsByPatient: (patientId) => get().prescriptions.filter((p) => p.patientId === patientId),
  getPatientReminders: (patientId) => get().reminders.filter((r) => r.patientId === patientId),
  getShortagesByDrug: (drugId) => get().shortages.filter((s) => s.drugId === drugId),
  getTodayPickups: () => {
    const t = today()
    return get().prescriptions.filter((p) => p.pickupDate === t && p.status === 'active')
  },
  getUrgentReminders: () => {
    const t = today()
    return get().reminders
      .filter((r) => (r.status === 'pending' || r.status === 'failed') && r.remindDate <= t)
      .sort((a, b) => a.remindDate.localeCompare(b.remindDate))
  },
  getActiveShortages: () => get().shortages.filter((s) => s.status !== 'restocked'),
  getPendingReminders: () => get().reminders.filter((r) => r.status === 'pending' || r.status === 'failed'),
}))
