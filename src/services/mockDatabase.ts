import type {
  User, Patient, Drug, Prescription, PrescriptionItem,
  ShortageRecord, SubstituteRecord, Reminder, Notification,
  WaitQueueEntry, AuditLog, StockChangeLog,
  DiseaseType, RoleType,
} from '@/types'

const DB_KEY = 'pharmacy_mock_db'

interface Database {
  users: User[]
  patients: Patient[]
  drugs: Drug[]
  prescriptions: Prescription[]
  shortages: ShortageRecord[]
  reminders: Reminder[]
  notifications: Notification[]
  waitQueue: WaitQueueEntry[]
  auditLogs: AuditLog[]
  stockChangeLogs: StockChangeLog[]
}

function genId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function daysFromNow(d: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function initData(): Database {
  const patients: Patient[] = [
    { id: 'p1', name: '王建国', idCard: '310101195503124512', phone: '13801234567', diseaseType: 'hypertension', createdAt: daysFromNow(-60) },
    { id: 'p2', name: '李秀英', idCard: '310102196207086734', phone: '13901234568', diseaseType: 'diabetes', createdAt: daysFromNow(-55) },
    { id: 'p3', name: '张伟明', idCard: '310103194812251234', phone: '13701234569', diseaseType: 'both', createdAt: daysFromNow(-50) },
    { id: 'p4', name: '陈桂芳', idCard: '310104195607153456', phone: '13601234570', diseaseType: 'hypertension', createdAt: daysFromNow(-45) },
    { id: 'p5', name: '刘德全', idCard: '310105196310097890', phone: '13501234571', diseaseType: 'diabetes', createdAt: daysFromNow(-40) },
    { id: 'p6', name: '赵美玲', idCard: '310106195904212345', phone: '13401234572', diseaseType: 'both', createdAt: daysFromNow(-35) },
    { id: 'p7', name: '孙志强', idCard: '310107194706183456', phone: '13301234573', diseaseType: 'hypertension', createdAt: daysFromNow(-30) },
    { id: 'p8', name: '周凤兰', idCard: '310108196501075678', phone: '13201234574', diseaseType: 'diabetes', createdAt: daysFromNow(-25) },
  ]

  const drugs: Drug[] = [
    { id: 'd1', name: '苯磺酸氨氯地平片', specification: '5mg×28片', category: 'hypertension', stock: 120, unit: '盒', safetyStock: 20, updatedAt: today() },
    { id: 'd2', name: '缬沙坦胶囊', specification: '80mg×7粒', category: 'hypertension', stock: 0, unit: '盒', safetyStock: 15, updatedAt: today() },
    { id: 'd3', name: '硝苯地平控释片', specification: '30mg×7片', category: 'hypertension', stock: 85, unit: '盒', safetyStock: 15, updatedAt: today() },
    { id: 'd4', name: '盐酸二甲双胍片', specification: '0.5g×20片', category: 'diabetes', stock: 200, unit: '盒', safetyStock: 30, updatedAt: today() },
    { id: 'd5', name: '格列美脲片', specification: '2mg×30片', category: 'diabetes', stock: 0, unit: '盒', safetyStock: 20, updatedAt: today() },
    { id: 'd6', name: '阿卡波糖片', specification: '50mg×30片', category: 'diabetes', stock: 60, unit: '盒', safetyStock: 15, updatedAt: today() },
    { id: 'd7', name: '厄贝沙坦片', specification: '150mg×7片', category: 'hypertension', stock: 45, unit: '盒', safetyStock: 10, updatedAt: today() },
    { id: 'd8', name: '瑞格列奈片', specification: '1mg×30片', category: 'diabetes', stock: 30, unit: '盒', safetyStock: 10, updatedAt: today() },
    { id: 'd9', name: '复方利血平片', specification: '100片', category: 'hypertension', stock: 150, unit: '瓶', safetyStock: 20, updatedAt: today() },
    { id: 'd10', name: '恩替卡韦分散片', specification: '0.5mg×7片', category: 'cardiovascular', stock: 80, unit: '盒', safetyStock: 10, updatedAt: today() },
  ]

  const makeItems = (rxId: string, specs: Array<{ drugId: string; qty: number; dosage: string; remQty: number }>): PrescriptionItem[] =>
    specs.map((s, i) => ({
      id: `ri${rxId.slice(2)}_${i}`, prescriptionId: rxId, drugId: s.drugId, quantity: s.qty, dosage: s.dosage, remainingQuantity: s.remQty }))

  const prescriptions: Prescription[] = [
    { id: 'rx1', patientId: 'p1', registeredBy: 'u2', insuranceType: 'urban_employee', remainingDays: 5, pickupDate: daysFromNow(0), status: 'active', createdAt: daysFromNow(-25), updatedAt: daysFromNow(-25), items: makeItems('rx1', [{ drugId: 'd1', qty: 4, dosage: '每日1次，每次1片', remQty: 5 }, { drugId: 'd7', qty: 4, dosage: '每日1次，每次1片', remQty: 5 }]) },
    { id: 'rx2', patientId: 'p2', registeredBy: 'u2', insuranceType: 'urban_resident', remainingDays: 2, pickupDate: daysFromNow(1), status: 'active', createdAt: daysFromNow(-28), updatedAt: daysFromNow(-28), items: makeItems('rx2', [{ drugId: 'd4', qty: 3, dosage: '每日2次，每次1片', remQty: 4 }, { drugId: 'd6', qty: 3, dosage: '每日3次，每次1片', remQty: 9 }]) },
    { id: 'rx3', patientId: 'p3', registeredBy: 'u2', insuranceType: 'rural_coop', remainingDays: 12, pickupDate: daysFromNow(5), status: 'active', createdAt: daysFromNow(-18), updatedAt: daysFromNow(-18), items: makeItems('rx3', [{ drugId: 'd1', qty: 4, dosage: '每日1次，每次1片', remQty: 12 }, { drugId: 'd4', qty: 3, dosage: '每日2次，每次1片', remQty: 12 }]) },
    { id: 'rx4', patientId: 'p4', registeredBy: 'u2', insuranceType: 'urban_employee', remainingDays: 1, pickupDate: daysFromNow(0), status: 'active', createdAt: daysFromNow(-29), updatedAt: daysFromNow(-29), items: makeItems('rx4', [{ drugId: 'd3', qty: 4, dosage: '每日1次，每次1片', remQty: 1 }]) },
    { id: 'rx5', patientId: 'p5', registeredBy: 'u2', insuranceType: 'self_pay', remainingDays: 20, pickupDate: daysFromNow(8), status: 'active', createdAt: daysFromNow(-10), updatedAt: daysFromNow(-10), items: makeItems('rx5', [{ drugId: 'd4', qty: 3, dosage: '每日2次，每次1片', remQty: 20 }, { drugId: 'd8', qty: 3, dosage: '每日3次，每次1片', remQty: 20 }]) },
    { id: 'rx6', patientId: 'p6', registeredBy: 'u2', insuranceType: 'urban_resident', remainingDays: 8, pickupDate: daysFromNow(3), status: 'active', createdAt: daysFromNow(-22), updatedAt: daysFromNow(-22), items: makeItems('rx6', [{ drugId: 'd3', qty: 4, dosage: '每日1次，每次1片', remQty: 8 }, { drugId: 'd6', qty: 3, dosage: '每日3次，每次1片', remQty: 8 }]) },
  ]

  const shortages: ShortageRecord[] = [
    { id: 's1', drugId: 'd2', registeredBy: 'u2', shortageQuantity: 50, estimatedArrivalDate: daysFromNow(3), status: 'shortage', createdAt: daysFromNow(-2), substitutes: [{ id: 'sub1', shortageId: 's1', substituteDrugId: 'd7', registeredBy: 'u2', reason: '同为ARB类降压药，作用机制相似', status: 'active', patientIds: ['p1'], createdAt: daysFromNow(-2) }] },
    { id: 's2', drugId: 'd5', registeredBy: 'u2', shortageQuantity: 30, estimatedArrivalDate: daysFromNow(5), status: 'substituted', createdAt: daysFromNow(-4), substitutes: [{ id: 'sub2', shortageId: 's2', substituteDrugId: 'd8', registeredBy: 'u2', reason: '同为促胰岛素分泌剂，可替代使用', status: 'active', patientIds: ['p2', 'p5'], createdAt: daysFromNow(-4) }] },
  ]

  const reminders: Reminder[] = [
    { id: 'rm1', patientId: 'p1', prescriptionId: 'rx1', shortageId: '', type: 'renewal_7d', remindDate: daysFromNow(-2), status: 'sent', message: '王建国的高血压处方将在5天后到期，请尽快联系患者续方', retryCount: 0, lastSentAt: daysFromNow(-2), confirmedBy: '', confirmedAt: '' },
    { id: 'rm2', patientId: 'p1', prescriptionId: 'rx1', shortageId: '', type: 'renewal_3d', remindDate: daysFromNow(2), status: 'pending', message: '王建国的高血压处方将在2天后到期，请立即联系患者续方', retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '' },
    { id: 'rm3', patientId: 'p2', prescriptionId: 'rx2', shortageId: '', type: 'renewal_3d', remindDate: daysFromNow(-1), status: 'sent', message: '李秀英的糖尿病处方将在2天后到期，请尽快联系患者续方', retryCount: 0, lastSentAt: daysFromNow(-1), confirmedBy: '', confirmedAt: '' },
    { id: 'rm4', patientId: 'p2', prescriptionId: 'rx2', shortageId: '', type: 'renewal_1d', remindDate: today(), status: 'pending', message: '李秀英的糖尿病处方明天到期，请立即联系患者续方！', retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '' },
    { id: 'rm5', patientId: 'p4', prescriptionId: 'rx4', shortageId: '', type: 'renewal_1d', remindDate: today(), status: 'pending', message: '陈桂芳的高血压处方今天到期，请立即联系患者续方！', retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '' },
    { id: 'rm6', patientId: 'p1', prescriptionId: 'rx1', shortageId: 's1', type: 'substitute_notice', remindDate: daysFromNow(-1), status: 'sent', message: '缬沙坦胶囊缺货，建议替换为厄贝沙坦片，已通知患者王建国', retryCount: 0, lastSentAt: daysFromNow(-1), confirmedBy: '', confirmedAt: '' },
    { id: 'rm7', patientId: 'p3', prescriptionId: 'rx3', shortageId: '', type: 'renewal_7d', remindDate: daysFromNow(5), status: 'pending', message: '张伟明的处方将在7天后到期，请提前联系患者续方', retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '' },
    { id: 'rm8', patientId: 'p6', prescriptionId: 'rx6', shortageId: '', type: 'renewal_7d', remindDate: daysFromNow(1), status: 'pending', message: '赵美玲的处方将在5天后到期，请尽快联系患者续方', retryCount: 0, lastSentAt: '', confirmedBy: '', confirmedAt: '' },
  ]

  const waitQueue: WaitQueueEntry[] = [
    { id: 'wq1', shortageId: 's1', patientId: 'p1', status: 'waiting', position: 1, notifiedAt: '', servedAt: '', createdAt: daysFromNow(-2) },
    { id: 'wq2', shortageId: 's2', patientId: 'p2', status: 'notified', position: 1, notifiedAt: daysFromNow(-4), servedAt: '', createdAt: daysFromNow(-4) },
    { id: 'wq3', shortageId: 's2', patientId: 'p5', status: 'notified', position: 2, notifiedAt: daysFromNow(-4), servedAt: '', createdAt: daysFromNow(-4) },
  ]

  const auditLogs: AuditLog[] = [
    { id: 'al1', action: 'user_login', entityType: 'user', entityId: 'u2', operator: 'u2', operatorRole: 'pharmacist', beforeSnapshot: null, afterSnapshot: null, changes: {}, ip: '127.0.0.1', userAgent: navigator.userAgent, createdAt: daysFromNow(-30) + 'T09:00:00', details: '张药师登录系统' },
    { id: 'al2', action: 'prescription_created', entityType: 'prescription', entityId: 'rx1', operator: 'u2', operatorRole: 'pharmacist', beforeSnapshot: null, afterSnapshot: { id: 'rx1', patientId: 'p1' }, changes: { status: { before: null, after: 'active' } }, ip: '127.0.0.1', userAgent: navigator.userAgent, createdAt: daysFromNow(-25) + 'T10:15:00', details: '创建处方rx1-王建国' },
    { id: 'al3', action: 'shortage_registered', entityType: 'shortage', entityId: 's2', operator: 'u2', operatorRole: 'pharmacist', beforeSnapshot: null, afterSnapshot: { id: 's2', drugId: 'd5' }, changes: { stock: { before: 30, after: 0 } }, ip: '127.0.0.1', userAgent: navigator.userAgent, createdAt: daysFromNow(-4) + 'T14:20:00', details: '登记缺货：格列美脲片' },
    { id: 'al4', action: 'shortage_substituted', entityType: 'shortage', entityId: 's2', operator: 'u2', operatorRole: 'pharmacist', beforeSnapshot: { id: 's2', status: 'shortage' }, afterSnapshot: { id: 's2', status: 'substituted' }, changes: { status: { before: 'shortage', after: 'substituted' } }, ip: '127.0.0.1', userAgent: navigator.userAgent, createdAt: daysFromNow(-4) + 'T14:30:00', details: '替代方案：格列美脲片 → 瑞格列奈片' },
  ]

  const stockChangeLogs: StockChangeLog[] = [
    { id: 'sc1', drugId: 'd1', changeQuantity: -4, beforeStock: 124, afterStock: 120, reason: 'prescription_dispense', operator: 'u2', referenceId: 'rx1', notes: '处方发药', createdAt: daysFromNow(-25) },
    { id: 'sc2', drugId: 'd5', changeQuantity: -30, beforeStock: 30, afterStock: 0, reason: 'shortage_register', operator: 'u2', referenceId: 's2', notes: '缺货登记', createdAt: daysFromNow(-4) },
  ]

  const users: User[] = [
    { id: 'u1', username: 'admin', name: '系统管理员', role: 'admin', password: '123456', createdAt: daysFromNow(-90) },
    { id: 'u2', username: 'pharmacist1', name: '张药师', role: 'pharmacist', password: '123456', createdAt: daysFromNow(-90) },
    { id: 'u3', username: 'cashier1', name: '王收费', role: 'cashier', password: '123456', createdAt: daysFromNow(-90) },
    { id: 'u4', username: 'viewer1', name: '赵视察', role: 'viewer', password: '123456', createdAt: daysFromNow(-90) },
  ]

  return { users, patients, drugs, prescriptions, shortages, reminders, notifications: [], waitQueue, auditLogs, stockChangeLogs }
}

let _db: Database | null = null

function load(): Database {
  if (_db) return _db
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    try {
      _db = JSON.parse(raw) as Database
      return _db!
    } catch {
      _db = initData()
      save()
      return _db!
    }
  }
  _db = initData()
  save()
  return _db!
}

function save() {
  if (_db) {
    localStorage.setItem(DB_KEY, JSON.stringify(_db))
  }
}

export function resetDatabase(): void {
  localStorage.removeItem(DB_KEY)
  _db = initData()
  save()
}

export async function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const db = {
  async init(): Promise<void> {
    load()
    return delay(undefined, 100)
  },

  async reset(): Promise<void> {
    resetDatabase()
    return delay(undefined, 200)
  },

  // Users
  async findUserByUsername(username: string): Promise<User | undefined> {
    const d = load()
    return delay(d.users.find((u) => u.username === username), 100)
  },
  async findUserById(id: string): Promise<User | undefined> {
    const d = load()
    return delay(d.users.find((u) => u.id === id), 100)
  },
  async getUsers(): Promise<User[]> {
    const d = load()
    return delay([...d.users], 100)
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    const d = load()
    return delay([...d.patients], 150)
  },
  async createPatient(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const d = load()
    const p: Patient = { ...data, id: genId(), createdAt: today() }
    d.patients.push(p)
    save()
    return delay({ ...p }, 300)
  },
  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient | undefined> {
    const d = load()
    const idx = d.patients.findIndex((p) => p.id === id)
    if (idx >= 0) {
      d.patients[idx] = { ...d.patients[idx], ...data }
      save()
      return delay({ ...d.patients[idx] }, 250)
    }
    return delay(undefined, 150)
  },

  // Drugs
  async getDrugs(): Promise<Drug[]> {
    const d = load()
    return delay([...d.drugs], 150)
  },
  async updateDrug(id: string, data: Partial<Drug>): Promise<Drug | undefined> {
    const d = load()
    const idx = d.drugs.findIndex((drug) => drug.id === id)
    if (idx >= 0) {
      d.drugs[idx] = { ...d.drugs[idx], ...data, updatedAt: today() }
      save()
      return delay({ ...d.drugs[idx] }, 250)
    }
    return delay(undefined, 150)
  },

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    const d = load()
    return delay(d.prescriptions.map((p) => ({ ...p, items: [...p.items] })), 200)
  },
  async createPrescription(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[] }): Promise<Prescription> {
    const d = load()
    const id = genId()
    const items: PrescriptionItem[] = data.items.map((it) => ({ ...it, id: genId(), prescriptionId: id }))
    const rx: Prescription = { ...data, id, items, createdAt: today(), updatedAt: today() }
    d.prescriptions.push(rx)
    save()
    return delay({ ...rx, items: [...items] }, 400)
  },
  async updatePrescription(id: string, data: Partial<Prescription>): Promise<Prescription | undefined> {
    const d = load()
    const idx = d.prescriptions.findIndex((p) => p.id === id)
    if (idx >= 0) {
      d.prescriptions[idx] = { ...d.prescriptions[idx], ...data, updatedAt: today() }
      save()
      return delay({ ...d.prescriptions[idx], items: [...d.prescriptions[idx].items] }, 300)
    }
    return delay(undefined, 150)
  },

  // Shortages
  async getShortages(): Promise<ShortageRecord[]> {
    const d = load()
    return delay(d.shortages.map((s) => ({ ...s, substitutes: [...s.substitutes] })), 200)
  },
  async createShortage(data: Omit<ShortageRecord, 'id' | 'substitutes' | 'createdAt'>): Promise<ShortageRecord> {
    const d = load()
    const s: ShortageRecord = { ...data, id: genId(), substitutes: [], createdAt: today() }
    d.shortages.push(s)
    save()
    return delay({ ...s, substitutes: [] }, 350)
  },
  async updateShortage(id: string, data: Partial<ShortageRecord>): Promise<ShortageRecord | undefined> {
    const d = load()
    const idx = d.shortages.findIndex((s) => s.id === id)
    if (idx >= 0) {
      d.shortages[idx] = { ...d.shortages[idx], ...data }
      save()
      return delay({ ...d.shortages[idx], substitutes: [...d.shortages[idx].substitutes] }, 300)
    }
    return delay(undefined, 150)
  },
  async addSubstitute(shortageId: string, sub: Omit<SubstituteRecord, 'id' | 'shortageId' | 'createdAt'>): Promise<ShortageRecord | undefined> {
    const d = load()
    const idx = d.shortages.findIndex((s) => s.id === shortageId)
    if (idx >= 0) {
      const newSub: SubstituteRecord = { ...sub, id: genId(), shortageId, createdAt: today() }
      d.shortages[idx].substitutes.push(newSub)
      d.shortages[idx].status = 'substituted'
      save()
      return delay({ ...d.shortages[idx], substitutes: [...d.shortages[idx].substitutes] }, 350)
    }
    return delay(undefined, 150)
  },

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    const d = load()
    return delay([...d.reminders], 150)
  },
  async createReminder(data: Omit<Reminder, 'id'>): Promise<Reminder> {
    const d = load()
    const r: Reminder = { ...data, id: genId() }
    d.reminders.push(r)
    save()
    return delay({ ...r }, 300)
  },
  async updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const d = load()
    const idx = d.reminders.findIndex((r) => r.id === id)
    if (idx >= 0) {
      d.reminders[idx] = { ...d.reminders[idx], ...data }
      save()
      return delay({ ...d.reminders[idx] }, 250)
    }
    return delay(undefined, 150)
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const d = load()
    return delay([...d.notifications], 150)
  },
  async createNotification(data: Omit<Notification, 'id'>): Promise<Notification> {
    const d = load()
    const n: Notification = { ...data, id: genId() }
    d.notifications.push(n)
    save()
    return delay({ ...n }, 300)
  },
  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    const d = load()
    const idx = d.notifications.findIndex((n) => n.id === id)
    if (idx >= 0) {
      d.notifications[idx] = { ...d.notifications[idx], ...data }
      save()
      return delay({ ...d.notifications[idx] }, 250)
    }
    return delay(undefined, 150)
  },

  // Wait Queue
  async getWaitQueue(): Promise<WaitQueueEntry[]> {
    const d = load()
    return delay([...d.waitQueue], 150)
  },
  async addWaitQueueEntry(data: Omit<WaitQueueEntry, 'id' | 'createdAt'>): Promise<WaitQueueEntry> {
    const d = load()
    const entry: WaitQueueEntry = { ...data, id: genId(), createdAt: today() }
    d.waitQueue.push(entry)
    save()
    return delay({ ...entry }, 300)
  },
  async updateWaitQueueEntry(id: string, data: Partial<WaitQueueEntry>): Promise<WaitQueueEntry | undefined> {
    const d = load()
    const idx = d.waitQueue.findIndex((w) => w.id === id)
    if (idx >= 0) {
      d.waitQueue[idx] = { ...d.waitQueue[idx], ...data }
      save()
      return delay({ ...d.waitQueue[idx] }, 250)
    }
    return delay(undefined, 150)
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const d = load()
    return delay([...d.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 200)
  },
  async createAuditLog(data: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    const d = load()
    const log: AuditLog = { ...data, id: genId() }
    d.auditLogs.unshift(log)
    if (d.auditLogs.length > 500) d.auditLogs.pop()
    save()
    return delay({ ...log }, 250)
  },

  // Stock Change Logs
  async getStockChangeLogs(): Promise<StockChangeLog[]> {
    const d = load()
    return delay([...d.stockChangeLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 150)
  },
  async createStockChangeLog(data: Omit<StockChangeLog, 'id'>): Promise<StockChangeLog> {
    const d = load()
    const log: StockChangeLog = { ...data, id: genId() }
    d.stockChangeLogs.unshift(log)
    if (d.stockChangeLogs.length > 300) d.stockChangeLogs.pop()
    save()
    return delay({ ...log }, 200)
  },
}

export type { DiseaseType, RoleType }
export { genId, daysFromNow, today }
