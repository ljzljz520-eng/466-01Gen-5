import { usePharmacyStore } from '@/store/usePharmacyStore'
import { Link } from 'react-router-dom'
import {
  Bell, PackageOpen, CalendarCheck, ClipboardList,
  AlertTriangle, Clock, ChevronRight, Pill, ArrowRight,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import { DISEASE_LABELS, INSURANCE_LABELS, REMINDER_STATUS_LABELS, SHORTAGE_STATUS_LABELS } from '@/types'

export default function Dashboard() {
  const { prescriptions, patients, drugs, reminders, getUrgentReminders, getTodayPickups, getActiveShortages } = usePharmacyStore()

  const urgentReminders = getUrgentReminders()
  const todayPickups = getTodayPickups()
  const activeShortages = getActiveShortages()
  const pendingCount = reminders.filter((r) => r.status === 'pending').length
  const activePrescriptions = prescriptions.filter((p) => p.status === 'active')

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))
  const drugMap = Object.fromEntries(drugs.map((d) => [d.id, d]))

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
        <p className="text-sm text-slate-400 mt-1">今日待办与预警总览</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="待发送提醒"
          value={pendingCount}
          icon={<Bell className="w-5 h-5" />}
          color="amber"
          subtitle={`${urgentReminders.length}条紧急`}
          trend="up"
        />
        <StatCard
          title="缺货药品"
          value={activeShortages.length}
          icon={<PackageOpen className="w-5 h-5" />}
          color="rose"
          subtitle={`${activeShortages.filter((s) => s.status === 'shortage').length}种未替代`}
        />
        <StatCard
          title="今日取药"
          value={todayPickups.length}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="teal"
          subtitle="位患者"
        />
        <StatCard
          title="活跃处方"
          value={activePrescriptions.length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="blue"
          subtitle={`${activePrescriptions.filter((p) => p.remainingDays <= 7).length}个即将到期`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                续方提醒
              </h2>
              <Link to="/reminders" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {urgentReminders.slice(0, 5).map((r) => {
                const patient = patientMap[r.patientId]
                const isUrgent = r.type === 'renewal_1d'
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-25 transition-colors">
                    <div className={`w-1 h-8 rounded-full shrink-0 ${isUrgent ? 'bg-rose-400' : r.type === 'renewal_3d' ? 'bg-amber-400' : 'bg-teal-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{patient?.name || '未知'}</span>
                        {patient && <span className="text-xs text-slate-400">{DISEASE_LABELS[patient.diseaseType]}</span>}
                        {isUrgent && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">
                            <AlertTriangle className="w-3 h-3" />紧急
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{r.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                    }`}>
                      {REMINDER_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                )
              })}
              {urgentReminders.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">暂无紧急提醒</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-rose-500" />
                缺货预警
              </h2>
              <Link to="/shortage" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                缺货管理 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activeShortages.map((s) => {
                const drug = drugMap[s.drugId]
                return (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-25 transition-colors">
                    <div className={`w-1 h-8 rounded-full shrink-0 ${s.status === 'shortage' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{drug?.name || '未知'}</span>
                        <span className="text-xs text-slate-400">{drug?.specification}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        缺{s.shortageQuantity}{drug?.unit || '盒'} · 预计到货：{s.estimatedArrivalDate || '待定'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      s.status === 'shortage' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {SHORTAGE_STATUS_LABELS[s.status]}
                    </span>
                  </div>
                )
              })}
              {activeShortages.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">暂无缺货记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-500" />
                今日取药
              </h2>
            </div>
            <div className="p-4">
              {todayPickups.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">今日无取药安排</div>
              ) : (
                <div className="space-y-2">
                  {todayPickups.map((rx) => {
                    const patient = patientMap[rx.patientId]
                    return (
                      <div key={rx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700 shrink-0">
                          {patient?.name?.slice(-1) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{patient?.name}</p>
                          <p className="text-xs text-slate-400">{rx.items.length}种药品 · {INSURANCE_LABELS[rx.insuranceType]}</p>
                        </div>
                        <Link
                          to={`/prescriptions/${rx.id}`}
                          className="text-teal-600 hover:text-teal-700"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                即将到期
              </h2>
            </div>
            <div className="p-4">
              {activePrescriptions
                .filter((p) => p.remainingDays <= 7)
                .sort((a, b) => a.remainingDays - b.remainingDays)
                .slice(0, 5)
                .map((rx) => {
                  const patient = patientMap[rx.patientId]
                  const color = rx.remainingDays <= 3 ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                  return (
                    <div key={rx.id} className="flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{patient?.name}</p>
                        <p className="text-xs text-slate-400">
                          {rx.items.map((i) => drugMap[i.drugId]?.name).join('、').slice(0, 20)}...
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${color}`}>
                        {rx.remainingDays}天
                      </span>
                    </div>
                  )
                })}
              {activePrescriptions.filter((p) => p.remainingDays <= 7).length === 0 && (
                <div className="py-4 text-center text-sm text-slate-400">暂无即将到期处方</div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl border border-teal-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-800">药品库存</span>
            </div>
            <div className="text-xs text-teal-600">
              共 {drugs.length} 种药品 · {drugs.filter((d) => d.stock > 0).length} 种有库存 · {drugs.filter((d) => d.stock === 0).length} 种缺货
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
