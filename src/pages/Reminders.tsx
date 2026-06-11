import { usePharmacyStore } from '@/store/usePharmacyStore'
import { Bell, BellOff, Check, Eye, Clock, AlertTriangle } from 'lucide-react'
import { DISEASE_LABELS, REMINDER_STATUS_LABELS, REMINDER_TYPE_LABELS } from '@/types'
import type { ReminderStatus } from '@/types'
import { useState } from 'react'

const statusActions: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  pending: { label: '发送通知', icon: Bell, color: 'bg-teal-600 text-white hover:bg-teal-700' },
  sent: { label: '确认回执', icon: Check, color: 'bg-amber-500 text-white hover:bg-amber-600' },
  confirmed: { label: '已确认', icon: Check, color: 'bg-slate-100 text-slate-400 cursor-default' },
  ignored: { label: '已忽略', icon: BellOff, color: 'bg-slate-100 text-slate-400 cursor-default' },
}

export default function Reminders() {
  const { reminders, patients, markReminderSent, markReminderConfirmed, markReminderIgnored } = usePharmacyStore()
  const [filter, setFilter] = useState<ReminderStatus | ''>('')

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  const sorted = [...reminders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
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

  const handleAction = (id: string, status: ReminderStatus) => {
    if (status === 'pending') markReminderSent(id)
    else if (status === 'sent') markReminderConfirmed(id)
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">续方提醒</h1>
          <p className="text-sm text-slate-400 mt-1">自动提醒慢病患者及时续方</p>
        </div>
        <div className="flex items-center gap-2">
          {(['', 'pending', 'sent', 'confirmed', 'ignored'] as const).map((s) => (
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
        {Object.entries(grouped).map(([date, items]) => (
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
                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 transition-all ${
                      r.status === 'pending' ? 'border-amber-200 shadow-amber-50' : 'border-slate-200'
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
                          r.status === 'sent' ? 'bg-sky-50 text-sky-600' :
                          r.status === 'confirmed' ? 'bg-teal-50 text-teal-600' :
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
                      {r.status !== 'confirmed' && r.status !== 'ignored' && (
                        <button
                          onClick={() => handleAction(r.id, r.status)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${action.color}`}
                        >
                          <ActionIcon className="w-3.5 h-3.5" />
                          {action.label}
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button
                          onClick={() => markReminderIgnored(r.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <BellOff className="w-3.5 h-3.5" />
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
        {Object.keys(grouped).length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">暂无提醒记录</div>
        )}
      </div>
    </div>
  )
}
