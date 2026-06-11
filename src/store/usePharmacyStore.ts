import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Patient, Drug, Prescription, PrescriptionItem,
  ShortageRecord, SubstituteRecord, Reminder,
} from '@/types'

function genId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function daysFromNow(d: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: '王建国', idCard: '310101195503124512', phone: '13801234567', diseaseType: 'hypertension' },
  { id: 'p2', name: '李秀英', idCard: '310102196207086734', phone: '13901234568', diseaseType: 'diabetes' },
  { id: 'p3', name: '张伟明', idCard: '310103194812251234', phone: '13701234569', diseaseType: 'both' },
  { id: 'p4', name: '陈桂芳', idCard: '310104195607153456', phone: '13601234570', diseaseType: 'hypertension' },
  { id: 'p5', name: '刘德全', idCard: '310105196310097890', phone: '13501234571', diseaseType: 'diabetes' },
  { id: 'p6', name: '赵美玲', idCard: '310106195904212345', phone: '13401234572', diseaseType: 'both' },
  { id: 'p7', name: '孙志强', idCard: '310107194706183456', phone: '13301234573', diseaseType: 'hypertension' },
  { id: 'p8', name: '周凤兰', idCard: '310108196501075678', phone: '13201234574', diseaseType: 'diabetes' },
]

const MOCK_DRUGS: Drug[] = [
  { id: 'd1', name: '苯磺酸氨氯地平片', specification: '5mg×28片', category: 'hypertension', stock: 120, unit: '盒' },
  { id: 'd2', name: '缬沙坦胶囊', specification: '80mg×7粒', category: 'hypertension', stock: 0, unit: '盒' },
  { id: 'd3', name: '硝苯地平控释片', specification: '30mg×7片', category: 'hypertension', stock: 85, unit: '盒' },
  { id: 'd4', name: '盐酸二甲双胍片', specification: '0.5g×20片', category: 'diabetes', stock: 200, unit: '盒' },
  { id: 'd5', name: '格列美脲片', specification: '2mg×30片', category: 'diabetes', stock: 0, unit: '盒' },
  { id: 'd6', name: '阿卡波糖片', specification: '50mg×30片', category: 'diabetes', stock: 60, unit: '盒' },
  { id: 'd7', name: '厄贝沙坦片', specification: '150mg×7片', category: 'hypertension', stock: 45, unit: '盒' },
  { id: 'd8', name: '瑞格列奈片', specification: '1mg×30片', category: 'diabetes', stock: 30, unit: '盒' },
  { id: 'd9', name: '复方利血平片', specification: '100片', category: 'hypertension', stock: 150, unit: '瓶' },
  { id: 'd10', name: '恩替卡韦分散片', specification: '0.5mg×7片', category: 'cardiovascular', stock: 80, unit: '盒' },
]

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx1', patientId: 'p1', insuranceType: 'urban_employee', remainingDays: 5,
    pickupDate: daysFromNow(0), status: 'active', createdAt: daysFromNow(-25),
    items: [
      { id: 'ri1', prescriptionId: 'rx1', drugId: 'd1', quantity: 4, dosage: '每日1次，每次1片', remainingQuantity: 5 },
      { id: 'ri2', prescriptionId: 'rx1', drugId: 'd7', quantity: 4, dosage: '每日1次，每次1片', remainingQuantity: 5 },
    ],
  },
  {
    id: 'rx2', patientId: 'p2', insuranceType: 'urban_resident', remainingDays: 2,
    pickupDate: daysFromNow(1), status: 'active', createdAt: daysFromNow(-28),
    items: [
      { id: 'ri3', prescriptionId: 'rx2', drugId: 'd4', quantity: 3, dosage: '每日2次，每次1片', remainingQuantity: 4 },
      { id: 'ri4', prescriptionId: 'rx2', drugId: 'd6', quantity: 3, dosage: '每日3次，每次1片', remainingQuantity: 9 },
    ],
  },
  {
    id: 'rx3', patientId: 'p3', insuranceType: 'rural_coop', remainingDays: 12,
    pickupDate: daysFromNow(5), status: 'active', createdAt: daysFromNow(-18),
    items: [
      { id: 'ri5', prescriptionId: 'rx3', drugId: 'd1', quantity: 4, dosage: '每日1次，每次1片', remainingQuantity: 12 },
      { id: 'ri6', prescriptionId: 'rx3', drugId: 'd4', quantity: 3, dosage: '每日2次，每次1片', remainingQuantity: 12 },
    ],
  },
  {
    id: 'rx4', patientId: 'p4', insuranceType: 'urban_employee', remainingDays: 1,
    pickupDate: daysFromNow(0), status: 'active', createdAt: daysFromNow(-29),
    items: [
      { id: 'ri7', prescriptionId: 'rx4', drugId: 'd3', quantity: 4, dosage: '每日1次，每次1片', remainingQuantity: 1 },
    ],
  },
  {
    id: 'rx5', patientId: 'p5', insuranceType: 'self_pay', remainingDays: 20,
    pickupDate: daysFromNow(8), status: 'active', createdAt: daysFromNow(-10),
    items: [
      { id: 'ri8', prescriptionId: 'rx5', drugId: 'd4', quantity: 3, dosage: '每日2次，每次1片', remainingQuantity: 20 },
      { id: 'ri9', prescriptionId: 'rx5', drugId: 'd8', quantity: 3, dosage: '每日3次，每次1片', remainingQuantity: 20 },
    ],
  },
  {
    id: 'rx6', patientId: 'p6', insuranceType: 'urban_resident', remainingDays: 8,
    pickupDate: daysFromNow(3), status: 'active', createdAt: daysFromNow(-22),
    items: [
      { id: 'ri10', prescriptionId: 'rx6', drugId: 'd3', quantity: 4, dosage: '每日1次，每次1片', remainingQuantity: 8 },
      { id: 'ri11', prescriptionId: 'rx6', drugId: 'd6', quantity: 3, dosage: '每日3次，每次1片', remainingQuantity: 8 },
    ],
  },
]

const MOCK_SHORTAGES: ShortageRecord[] = [
  {
    id: 's1', drugId: 'd2', shortageQuantity: 50, estimatedArrivalDate: daysFromNow(3),
    status: 'shortage', createdAt: daysFromNow(-2),
    substitutes: [
      { id: 'sub1', shortageId: 's1', substituteDrugId: 'd7', reason: '同为ARB类降压药，作用机制相似', status: 'active', patientIds: ['p1'] },
    ],
  },
  {
    id: 's2', drugId: 'd5', shortageQuantity: 30, estimatedArrivalDate: daysFromNow(5),
    status: 'substituted', createdAt: daysFromNow(-4),
    substitutes: [
      { id: 'sub2', shortageId: 's2', substituteDrugId: 'd8', reason: '同为促胰岛素分泌剂，可替代使用', status: 'active', patientIds: ['p2', 'p5'] },
    ],
  },
]

const MOCK_REMINDERS: Reminder[] = [
  { id: 'rm1', patientId: 'p1', prescriptionId: 'rx1', type: 'renewal_7d', remindDate: daysFromNow(-2), status: 'sent', message: '王建国的高血压处方将在5天后到期，请尽快联系患者续方' },
  { id: 'rm2', patientId: 'p1', prescriptionId: 'rx1', type: 'renewal_3d', remindDate: daysFromNow(2), status: 'pending', message: '王建国的高血压处方将在2天后到期，请立即联系患者续方' },
  { id: 'rm3', patientId: 'p2', prescriptionId: 'rx2', type: 'renewal_3d', remindDate: daysFromNow(-1), status: 'sent', message: '李秀英的糖尿病处方将在2天后到期，请尽快联系患者续方' },
  { id: 'rm4', patientId: 'p2', prescriptionId: 'rx2', type: 'renewal_1d', remindDate: daysFromNow(0), status: 'pending', message: '李秀英的糖尿病处方明天到期，请立即联系患者续方！' },
  { id: 'rm5', patientId: 'p4', prescriptionId: 'rx4', type: 'renewal_1d', remindDate: daysFromNow(0), status: 'pending', message: '陈桂芳的高血压处方今天到期，请立即联系患者续方！' },
  { id: 'rm6', patientId: 'p1', prescriptionId: 'rx1', type: 'substitute_notice', remindDate: daysFromNow(-1), status: 'sent', message: '缬沙坦胶囊缺货，建议替换为厄贝沙坦片，已通知患者王建国' },
  { id: 'rm7', patientId: 'p3', prescriptionId: 'rx3', type: 'renewal_7d', remindDate: daysFromNow(5), status: 'pending', message: '张伟明的处方将在7天后到期，请提前联系患者续方' },
  { id: 'rm8', patientId: 'p6', prescriptionId: 'rx6', type: 'renewal_7d', remindDate: daysFromNow(1), status: 'pending', message: '赵美玲的处方将在5天后到期，请尽快联系患者续方' },
]

interface PharmacyState {
  patients: Patient[]
  drugs: Drug[]
  prescriptions: Prescription[]
  shortages: ShortageRecord[]
  reminders: Reminder[]

  addPatient: (patient: Omit<Patient, 'id'>) => string
  updatePatient: (id: string, data: Partial<Patient>) => void

  addPrescription: (rx: Omit<Prescription, 'id' | 'items' | 'createdAt'> & { items: Omit<PrescriptionItem, 'id' | 'prescriptionId'>[] }) => string
  updatePrescription: (id: string, data: Partial<Prescription>) => void

  addShortage: (s: Omit<ShortageRecord, 'id' | 'substitutes' | 'createdAt'>) => string
  addSubstitute: (shortageId: string, sub: Omit<SubstituteRecord, 'id' | 'shortageId'>) => void
  restockShortage: (shortageId: string) => void

  addReminder: (r: Omit<Reminder, 'id'>) => string
  updateReminder: (id: string, data: Partial<Reminder>) => void
  markReminderSent: (id: string) => void
  markReminderConfirmed: (id: string) => void
  markReminderIgnored: (id: string) => void

  getPatient: (id: string) => Patient | undefined
  getDrug: (id: string) => Drug | undefined
  getPrescriptionsByPatient: (patientId: string) => Prescription[]
  getPatientReminders: (patientId: string) => Reminder[]
  getShortagesByDrug: (drugId: string) => ShortageRecord[]
  getTodayPickups: () => Prescription[]
  getUrgentReminders: () => Reminder[]
  getActiveShortages: () => ShortageRecord[]
}

export const usePharmacyStore = create<PharmacyState>()(
  persist(
    (set, get) => ({
      patients: MOCK_PATIENTS,
      drugs: MOCK_DRUGS,
      prescriptions: MOCK_PRESCRIPTIONS,
      shortages: MOCK_SHORTAGES,
      reminders: MOCK_REMINDERS,

      addPatient: (data) => {
        const id = genId()
        set((s) => ({ patients: [...s.patients, { ...data, id }] }))
        return id
      },
      updatePatient: (id, data) => {
        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }))
      },

      addPrescription: (data) => {
        const id = genId()
        const items: PrescriptionItem[] = data.items.map((item) => ({
          ...item,
          id: genId(),
          prescriptionId: id,
        }))
        set((s) => ({
          prescriptions: [...s.prescriptions, { ...data, id, items, createdAt: new Date().toISOString().slice(0, 10) }],
        }))

        const remainingDays = data.remainingDays
        if (remainingDays <= 7) {
          const patient = get().patients.find((p) => p.id === data.patientId)
          const type7 = remainingDays <= 7 ? 'renewal_7d' as const : null
          const type3 = remainingDays <= 3 ? 'renewal_3d' as const : null
          const type1 = remainingDays <= 1 ? 'renewal_1d' as const : null
          const types = [type7, type3, type1].filter(Boolean) as Array<'renewal_7d' | 'renewal_3d' | 'renewal_1d'>
          const msgs: Record<string, string> = {
            renewal_7d: `${patient?.name || '患者'}的处方将在7天内到期，请提前联系续方`,
            renewal_3d: `${patient?.name || '患者'}的处方将在3天内到期，请尽快联系续方`,
            renewal_1d: `${patient?.name || '患者'}的处方即将到期，请立即联系续方！`,
          }
          types.forEach((t) => {
            const remindDate = daysFromNow(remainingDays - (t === 'renewal_7d' ? 7 : t === 'renewal_3d' ? 3 : 1))
            set((s) => ({
              reminders: [...s.reminders, {
                id: genId(),
                patientId: data.patientId,
                prescriptionId: id,
                type: t,
                remindDate,
                status: 'pending',
                message: msgs[t],
              }],
            }))
          })
        }
        return id
      },
      updatePrescription: (id, data) => {
        set((s) => ({
          prescriptions: s.prescriptions.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }))
      },

      addShortage: (data) => {
        const id = genId()
        set((s) => ({
          shortages: [...s.shortages, { ...data, id, substitutes: [], createdAt: new Date().toISOString().slice(0, 10) }],
        }))
        set((s) => ({
          drugs: s.drugs.map((d) => (d.id === data.drugId ? { ...d, stock: 0 } : d)),
        }))
        return id
      },
      addSubstitute: (shortageId, sub) => {
        const newSub: SubstituteRecord = { ...sub, id: genId(), shortageId }
        set((s) => ({
          shortages: s.shortages.map((sh) =>
            sh.id === shortageId ? { ...sh, substitutes: [...sh.substitutes, newSub], status: 'substituted' as const } : sh
          ),
        }))
      },
      restockShortage: (shortageId) => {
        const shortage = get().shortages.find((s) => s.id === shortageId)
        if (!shortage) return
        set((s) => ({
          shortages: s.shortages.map((sh) =>
            sh.id === shortageId ? { ...sh, status: 'restocked' as const } : sh
          ),
        }))
        set((s) => ({
          drugs: s.drugs.map((d) => {
            if (d.id === shortage.drugId) {
              return { ...d, stock: d.stock + shortage.shortageQuantity }
            }
            return d
          }),
        }))
        const drug = get().getDrug(shortage.drugId)
        const affectedPatients = new Set<string>()
        shortage.substitutes.forEach((sub) => {
          sub.patientIds.forEach((pid) => affectedPatients.add(pid))
        })
        affectedPatients.forEach((pid) => {
          const patient = get().getPatient(pid)
          set((s) => ({
            reminders: [...s.reminders, {
              id: genId(),
              patientId: pid,
              prescriptionId: '',
              type: 'shortage_arrival' as const,
              remindDate: new Date().toISOString().slice(0, 10),
              status: 'pending' as const,
              message: `${drug?.name || '药品'}已到货，请通知患者${patient?.name || ''}前来取药`,
            }],
          }))
        })
      },

      addReminder: (data) => {
        const id = genId()
        set((s) => ({ reminders: [...s.reminders, { ...data, id }] }))
        return id
      },
      updateReminder: (id, data) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }))
      },
      markReminderSent: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, status: 'sent' as const } : r)),
        }))
      },
      markReminderConfirmed: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, status: 'confirmed' as const } : r)),
        }))
      },
      markReminderIgnored: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, status: 'ignored' as const } : r)),
        }))
      },

      getPatient: (id) => get().patients.find((p) => p.id === id),
      getDrug: (id) => get().drugs.find((d) => d.id === id),
      getPrescriptionsByPatient: (patientId) => get().prescriptions.filter((p) => p.patientId === patientId),
      getPatientReminders: (patientId) => get().reminders.filter((r) => r.patientId === patientId),
      getShortagesByDrug: (drugId) => get().shortages.filter((s) => s.drugId === drugId),
      getTodayPickups: () => {
        const today = new Date().toISOString().slice(0, 10)
        return get().prescriptions.filter((p) => p.pickupDate === today && p.status === 'active')
      },
      getUrgentReminders: () => {
        const today = new Date().toISOString().slice(0, 10)
        return get().reminders
          .filter((r) => r.status === 'pending' && r.remindDate <= today)
          .sort((a, b) => a.remindDate.localeCompare(b.remindDate))
      },
      getActiveShortages: () => get().shortages.filter((s) => s.status !== 'restocked'),
    }),
    { name: 'pharmacy-store' }
  )
)
