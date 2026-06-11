export type DiseaseType = 'hypertension' | 'diabetes' | 'both'

export type InsuranceType = 'urban_employee' | 'urban_resident' | 'rural_coop' | 'self_pay'

export type PrescriptionStatus = 'active' | 'completed' | 'expired'

export type ShortageStatus = 'shortage' | 'substituted' | 'restocked'

export type ReminderStatus = 'pending' | 'sent' | 'confirmed' | 'ignored'

export type ReminderType = 'renewal_7d' | 'renewal_3d' | 'renewal_1d' | 'shortage_arrival' | 'substitute_notice'

export interface Patient {
  id: string
  name: string
  idCard: string
  phone: string
  diseaseType: DiseaseType
}

export interface Drug {
  id: string
  name: string
  specification: string
  category: 'hypertension' | 'diabetes' | 'cardiovascular' | 'other'
  stock: number
  unit: string
}

export interface PrescriptionItem {
  id: string
  prescriptionId: string
  drugId: string
  quantity: number
  dosage: string
  remainingQuantity: number
}

export interface Prescription {
  id: string
  patientId: string
  insuranceType: InsuranceType
  remainingDays: number
  pickupDate: string
  status: PrescriptionStatus
  items: PrescriptionItem[]
  createdAt: string
}

export interface ShortageRecord {
  id: string
  drugId: string
  shortageQuantity: number
  estimatedArrivalDate: string
  status: ShortageStatus
  substitutes: SubstituteRecord[]
  createdAt: string
}

export interface SubstituteRecord {
  id: string
  shortageId: string
  substituteDrugId: string
  reason: string
  status: 'active' | 'cancelled'
  patientIds: string[]
}

export interface Reminder {
  id: string
  patientId: string
  prescriptionId: string
  type: ReminderType
  remindDate: string
  status: ReminderStatus
  message: string
}

export const DISEASE_LABELS: Record<DiseaseType, string> = {
  hypertension: '高血压',
  diabetes: '糖尿病',
  both: '高血压+糖尿病',
}

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  urban_employee: '城镇职工医保',
  urban_resident: '城镇居民医保',
  rural_coop: '新农合',
  self_pay: '自费',
}

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active: '生效中',
  completed: '已完成',
  expired: '已过期',
}

export const SHORTAGE_STATUS_LABELS: Record<ShortageStatus, string> = {
  shortage: '缺货中',
  substituted: '已替代',
  restocked: '已到货',
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: '待发送',
  sent: '已发送',
  confirmed: '已确认',
  ignored: '已忽略',
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  renewal_7d: '续方提醒（7天）',
  renewal_3d: '续方提醒（3天）',
  renewal_1d: '续方提醒（1天）',
  shortage_arrival: '到货通知',
  substitute_notice: '替代药品通知',
}
