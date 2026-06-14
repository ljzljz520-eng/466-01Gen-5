// ===== 基础枚举类型 =====
export type DiseaseType = 'hypertension' | 'diabetes' | 'both'
export type InsuranceType = 'urban_employee' | 'urban_resident' | 'rural_coop' | 'self_pay'
export type PrescriptionStatus = 'active' | 'completed' | 'expired'
export type ShortageStatus = 'shortage' | 'substituted' | 'restocked'
export type ReminderStatus = 'pending' | 'sending' | 'sent' | 'confirmed' | 'ignored' | 'failed'
export type ReminderType = 'renewal_7d' | 'renewal_3d' | 'renewal_1d' | 'shortage_arrival' | 'substitute_notice'

// ===== 角色和权限 =====
export type RoleType = 'admin' | 'pharmacist' | 'cashier' | 'viewer'

export type PermissionType =
  | 'patient:view'
  | 'patient:create'
  | 'patient:edit'
  | 'prescription:view'
  | 'prescription:create'
  | 'prescription:edit'
  | 'prescription:complete'
  | 'shortage:view'
  | 'shortage:create'
  | 'shortage:edit'
  | 'shortage:restock'
  | 'reminder:view'
  | 'reminder:send'
  | 'reminder:confirm'
  | 'inventory:view'
  | 'inventory:adjust'
  | 'audit:view'
  | 'system:manage'

export const PERMISSIONS_BY_ROLE: Record<RoleType, PermissionType[]> = {
  admin: [
    'patient:view', 'patient:create', 'patient:edit',
    'prescription:view', 'prescription:create', 'prescription:edit', 'prescription:complete',
    'shortage:view', 'shortage:create', 'shortage:edit', 'shortage:restock',
    'reminder:view', 'reminder:send', 'reminder:confirm',
    'inventory:view', 'inventory:adjust',
    'audit:view', 'system:manage',
  ],
  pharmacist: [
    'patient:view', 'patient:create', 'patient:edit',
    'prescription:view', 'prescription:create', 'prescription:edit', 'prescription:complete',
    'shortage:view', 'shortage:create', 'shortage:edit', 'shortage:restock',
    'reminder:view', 'reminder:send', 'reminder:confirm',
    'inventory:view', 'inventory:adjust',
  ],
  cashier: [
    'patient:view',
    'prescription:view', 'prescription:complete',
    'shortage:view',
    'reminder:view', 'reminder:confirm',
    'inventory:view',
  ],
  viewer: [
    'patient:view',
    'prescription:view',
    'shortage:view',
    'reminder:view',
    'inventory:view',
  ],
}

export function hasPermission(role: RoleType, permission: PermissionType): boolean {
  return PERMISSIONS_BY_ROLE[role]?.includes(permission) ?? false
}

// ===== 通知和等待队列 =====
export type NotificationChannel = 'sms' | 'wechat' | 'app_push'
export type NotificationStatus = 'pending' | 'sent' | 'failed'
export type WaitQueueStatus = 'waiting' | 'notified' | 'served' | 'cancelled'

// ===== 库存变更原因 =====
export type StockChangeReason =
  | 'prescription_dispense'
  | 'shortage_register'
  | 'restock_arrival'
  | 'manual_adjust'
  | 'return'
  | 'expired'
  | 'inventory_check'

// ===== 审计操作类型 =====
export type AuditActionType =
  | 'user_login'
  | 'user_logout'
  | 'patient_created'
  | 'patient_updated'
  | 'prescription_created'
  | 'prescription_updated'
  | 'prescription_completed'
  | 'prescription_expired'
  | 'shortage_registered'
  | 'shortage_substituted'
  | 'shortage_restocked'
  | 'reminder_sent'
  | 'reminder_confirmed'
  | 'reminder_ignored'
  | 'reminder_failed'
  | 'notification_sent'
  | 'drug_stock_adjusted'
  | 'inventory_deducted'
  | 'inventory_restocked'
  | 'waitqueue_joined'
  | 'waitqueue_served'
  | 'data_reset'

// ===== Toast =====
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

// ===== 核心实体 =====
export interface User {
  id: string
  username: string
  name: string
  role: RoleType
  password: string
  createdAt: string
  lastLoginAt?: string
}

export interface Patient {
  id: string
  name: string
  idCard: string
  phone: string
  diseaseType: DiseaseType
  createdAt: string
}

export interface Drug {
  id: string
  name: string
  specification: string
  category: 'hypertension' | 'diabetes' | 'cardiovascular' | 'other'
  stock: number
  unit: string
  safetyStock: number
  updatedAt: string
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
  registeredBy: string
  insuranceType: InsuranceType
  remainingDays: number
  pickupDate: string
  status: PrescriptionStatus
  items: PrescriptionItem[]
  createdAt: string
  updatedAt: string
}

export interface SubstituteRecord {
  id: string
  shortageId: string
  substituteDrugId: string
  registeredBy: string
  reason: string
  status: 'active' | 'cancelled'
  patientIds: string[]
  createdAt: string
}

export interface ShortageRecord {
  id: string
  drugId: string
  registeredBy: string
  shortageQuantity: number
  estimatedArrivalDate: string
  status: ShortageStatus
  substitutes: SubstituteRecord[]
  createdAt: string
}

export interface Reminder {
  id: string
  patientId: string
  prescriptionId: string
  shortageId: string
  type: ReminderType
  remindDate: string
  status: ReminderStatus
  message: string
  retryCount: number
  lastSentAt: string
  confirmedBy: string
  confirmedAt: string
}

export interface Notification {
  id: string
  reminderId: string
  patientId: string
  channel: NotificationChannel
  recipient: string
  content: string
  status: NotificationStatus
  retryCount: number
  lastAttemptAt: string
  errorMessage: string
}

export interface WaitQueueEntry {
  id: string
  shortageId: string
  patientId: string
  status: WaitQueueStatus
  position: number
  notifiedAt: string
  servedAt: string
  createdAt: string
}

export interface AuditLog {
  id: string
  action: AuditActionType
  entityType: 'prescription' | 'shortage' | 'reminder' | 'patient' | 'drug' | 'notification' | 'waitqueue' | 'user'
  entityId: string
  operator: string
  operatorRole: RoleType
  beforeSnapshot: unknown
  afterSnapshot: unknown
  changes: Record<string, { before: unknown; after: unknown }>
  ip: string
  userAgent: string
  createdAt: string
  details: string
}

export interface StockChangeLog {
  id: string
  drugId: string
  changeQuantity: number
  beforeStock: number
  afterStock: number
  reason: StockChangeReason
  operator: string
  referenceId: string
  notes: string
  createdAt: string
}

// ===== 标签映射 =====
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
  sending: '发送中',
  sent: '已发送',
  confirmed: '已确认',
  ignored: '已忽略',
  failed: '发送失败',
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  renewal_7d: '续方提醒（7天）',
  renewal_3d: '续方提醒（3天）',
  renewal_1d: '续方提醒（1天）',
  shortage_arrival: '到货通知',
  substitute_notice: '替代药品通知',
}

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: '系统管理员',
  pharmacist: '执业药师',
  cashier: '收费窗口',
  viewer: '只读访客',
}

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  user_login: '用户登录',
  user_logout: '用户登出',
  patient_created: '创建患者',
  patient_updated: '更新患者',
  prescription_created: '创建处方',
  prescription_updated: '更新处方',
  prescription_completed: '完成处方',
  prescription_expired: '过期处方',
  shortage_registered: '登记缺货',
  shortage_substituted: '登记替代',
  shortage_restocked: '确认到货',
  reminder_sent: '发送提醒',
  reminder_confirmed: '确认回执',
  reminder_ignored: '忽略提醒',
  reminder_failed: '提醒失败',
  notification_sent: '发送通知',
  drug_stock_adjusted: '调整库存',
  inventory_deducted: '扣减库存',
  inventory_restocked: '入库库存',
  waitqueue_joined: '加入等待队列',
  waitqueue_served: '等待队列完成',
  data_reset: '重置数据',
}

export const STOCK_CHANGE_REASON_LABELS: Record<StockChangeReason, string> = {
  prescription_dispense: '处方发药',
  shortage_register: '缺货登记',
  restock_arrival: '到货入库',
  manual_adjust: '手动调整',
  return: '药品退回',
  expired: '过期报损',
  inventory_check: '盘点调整',
}

export const WAIT_QUEUE_STATUS_LABELS: Record<WaitQueueStatus, string> = {
  waiting: '等待中',
  notified: '已通知',
  served: '已取药',
  cancelled: '已取消',
}
