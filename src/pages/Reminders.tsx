import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Bell, BellOff, Check, Eye, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { DISEASE_LABELS, REMINDER_STATUS_LABELS, REMINDER_TYPE_LABELS } from '@/types'
import type { ReminderStatus } from '@/types'
import { useState } from 'react'

const statusActions: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  pending: { label: '发送通知', icon: Bell, color: 'bg-teal-600 text-white hover:bg-teal-700' },
  sending: { label: '发送中', icon: Bell, color: 'bg-teal-600/60 text-white cursor-wait' },
  sent: { label: '确认回执', icon: Check, color: 'bg-amber-500 text-white hover:bg-amber-600' },
  confirmed: { label: '已确认', icon: Check, color: 'bg-slate-100 text-slate-400 cursor-default' },
  ignored: { label: '已忽略', icon: BellOff, color: 'bg-slate-100 text-slate-400 cursor-default' },
  failed: { label: '重新发送', icon: Bell, color: 'bg-rose-600 text-white hover:bg-rose-700' },
}

export default function Reminders() {
  const { can } = usePermissions()
  const { reminders, patients, loading, sendReminder, confirmReminder, ignoreReminder } = usePharmacyStore((s) => ({
    reminders: s.reminders,
    patients: s.patients,
    loading: s.loading,
    sendReminder: s.sendReminder,
    confirmReminder: s.confirmReminder,
    ignoreReminder: s.ignoreReminder,
  }))
  const [filter, setFilter] = useState<ReminderStatus | ''>('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const isLoading = loading.reminders || loading.global

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  const sorted = [...reminders].sort((a, b) => {
    const aPriority = a.status === 'pending' || a.status === 'failed' ? 0 : a.status === 'sending' ? 1 : 2
    const bPriority = b.status === 'pending' || b.status === 'failed' ? 0 : b.status === 'sending' ? 1 : 2
    if (aPriority !== bPriority) return aPriority - bPriority
    return a.remindDate.localeCompare(b.remindDate)
  })

  const filtered = filter ? sorted.filter((r) => r.status === filter) : sorted

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, r) => {
    const key = r.remindDate
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const urgencyBadge = (type: string) => {
    if (type === 'renewal_1d') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600"><AlertTriangle className="w-3 h-3" />紧急</span>
    if (type === 'renewal_3d') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"><Clock className="w-3 h-3" />较急</span>
    if (type === 'renewal_7d') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600"><Bell className="w-3 h-3" />一般</span>
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600"><Eye className="w-3 h-3" />通知</span>
  }

  const handleAction = async (id: string, status: ReminderStatus) => {
    if (submittingId === id) return
    setSubmittingId(id)
    try {
      if (status === 'pending' || status === 'failed') {
        await sendReminder(id)
      } else if (status === 'sent') {
        await confirmReminder(id)
      }
    } finally {
      setSubmittingId(null)
    }
  }

  const handleIgnore = async (id: string) => {
    if (submittingId === id) return
    setSubmittingId(id)
    try {
      await ignoreReminder(id)
    } finally {
      setSubmittingId(null)
    }
  }

  if (!can('reminder:view')) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="py-16 text-center">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">您没有查看提醒的权限</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">续方提醒</h1>
          <p className="text-sm text-slate-400 mt-1">自动提醒慢病患者及时续方</p>
        </div>
        <div className="flex items-center gap-2">
          {(['', 'pending', 'sending', 'sent', 'confirmed', 'ignored', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filter === s ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {s === '' ? '全部' : REMINDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
              <span className="text-slate-500">加载中...</span>
            </div>
          </div>
        ) : Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h3 className="text-sm font-semibold text-slate-600">{date}</h3>
              <span className="text-xs text-slate-400">{items.length}条提醒</span>
            </div>
            <div className="space-y-2">
              {items.map((r) => {
                const patient = patientMap[r.patientId]
                const action = statusActions[r.status]
                const ActionIcon = action.icon
                const isSubmitting = submittingId === r.id
                const isHighlight = r.status === 'pending' || r.status === 'failed'
                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 transition-all ${
                      isHighlight ? 'border-amber-200 shadow-amber-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                      {patient?.name?.slice(-1) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800">{patient?.name || '未知'}</span>
                        {patient && <span className="text-xs text-slate-400">{DISEASE_LABELS[patient.diseaseType]}</span>}
                        {urgencyBadge(r.type)}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          r.status === 'sending' ? 'bg-sky-50 text-sky-600' :
                          r.status === 'sent' ? 'bg-sky-50 text-sky-600' :
                          r.status === 'confirmed' ? 'bg-teal-50 text-teal-600' :
                          r.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {REMINDER_STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{r.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {REMINDER_TYPE_LABELS[r.type]} · 提醒日期：{r.remindDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status !== 'confirmed' && r.status !== 'ignored' && r.status !== 'sending' && (
                        ((r.status === 'pending' || r.status === 'failed') && can('reminder:send')) ||
                        (r.status === 'sent' && can('reminder:confirm'))
                      ) && (
                        <button
                          onClick={() => handleAction(r.id, r.status)}
                          disabled={isSubmitting}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSubmitting ? 'opacity-70 cursor-wait' : ''} ${action.color}`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ActionIcon className="w-3.5 h-3.5" />
                          )}
                          {isSubmitting ? '处理中...' : action.label}
                        </button>
                      )}
                      {r.status === 'sending' && (
                        <button
                          disabled
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${action.color}`}
                        >
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {action.label}
                        </button>
                      )}
                      {(r.status === 'pending' || r.status === 'failed') && can('reminder:send') && (
                        <button
                          onClick={() => handleIgnore(r.id)}
                          disabled={isSubmitting}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            isSubmitting ? 'text-slate-300 cursor-wait' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5" />
                          )}
                          忽略
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {!isLoading && Object.keys(grouped).length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">暂无提醒记录</div>
        )}
      </div>
    </div>
  )
}
