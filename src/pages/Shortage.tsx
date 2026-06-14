import { useState } from 'react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { PackageOpen, AlertTriangle, ArrowRightLeft, Truck, Plus, Loader2 } from 'lucide-react'
import { SHORTAGE_STATUS_LABELS } from '@/types'
import type { ShortageStatus } from '@/types'
import Modal from '@/components/Modal'

export default function Shortage() {
  const { can } = usePermissions()

  const {
    shortages,
    drugs,
    patients,
    waitQueue,
    loading,
    addShortage,
    addSubstitute,
    restockShortage,
  } = usePharmacyStore((s) => ({
    shortages: s.shortages,
    drugs: s.drugs,
    patients: s.patients,
    waitQueue: s.waitQueue,
    loading: s.loading,
    addShortage: s.addShortage,
    addSubstitute: s.addSubstitute,
    restockShortage: s.restockShortage,
  }))

  const [showShortageModal, setShowShortageModal] = useState(false)
  const [showSubModal, setShowSubModal] = useState<string | null>(null)

  const [shortageDrugId, setShortageDrugId] = useState('')
  const [shortageQty, setShortageQty] = useState(0)
  const [estimatedDate, setEstimatedDate] = useState('')

  const [subDrugId, setSubDrugId] = useState('')
  const [subReason, setSubReason] = useState('')
  const [subPatientIds, setSubPatientIds] = useState<string[]>([])

  const [filter, setFilter] = useState<ShortageStatus | ''>('')
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  const isLoading = loading.shortages || loading.global
  const isSubmitting = (key: string) => !!submitting[key]
  const setSubmittingState = (key: string, value: boolean) =>
    setSubmitting((prev) => ({ ...prev, [key]: value }))

  const drugMap = Object.fromEntries(drugs.map((d) => [d.id, d]))
  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  const active = filter
    ? shortages.filter((s) => s.status === filter)
    : shortages.filter((s) => s.status !== 'restocked')

  const handleAddShortage = async () => {
    if (!shortageDrugId || shortageQty <= 0) return
    const key = 'add-shortage'
    setSubmittingState(key, true)
    try {
      await addShortage({
        drugId: shortageDrugId,
        shortageQuantity: shortageQty,
        estimatedArrivalDate: estimatedDate,
        status: 'shortage',
      })
      setShowShortageModal(false)
      setShortageDrugId('')
      setShortageQty(0)
      setEstimatedDate('')
    } catch (e) {
      console.error('登记缺货失败', e)
    } finally {
      setSubmittingState(key, false)
    }
  }

  const handleAddSubstitute = async () => {
    if (!showSubModal || !subDrugId) return
    const key = `add-sub-${showSubModal}`
    setSubmittingState(key, true)
    try {
      await addSubstitute(showSubModal, {
        substituteDrugId: subDrugId,
        reason: subReason,
        status: 'active',
        patientIds: subPatientIds,
      })
      setShowSubModal(null)
      setSubDrugId('')
      setSubReason('')
      setSubPatientIds([])
    } catch (e) {
      console.error('登记替代失败', e)
    } finally {
      setSubmittingState(key, false)
    }
  }

  const handleRestock = async (id: string) => {
    const key = `restock-${id}`
    setSubmittingState(key, true)
    try {
      await restockShortage(id)
    } catch (e) {
      console.error('确认到货失败', e)
    } finally {
      setSubmittingState(key, false)
    }
  }

  const affectedPatients = (shortageId: string) => {
    const s = shortages.find((sh) => sh.id === shortageId)
    if (!s) return []
    const pids = new Set<string>()
    s.substitutes.forEach((sub) => {
      sub.patientIds.forEach((pid) => pids.add(pid))
    })
    waitQueue.forEach((w) => {
      if (w.shortageId === shortageId) {
        pids.add(w.patientId)
      }
    })
    return Array.from(pids)
  }

  const statusIcon = (status: ShortageStatus) => {
    if (status === 'shortage') return <AlertTriangle className="w-4 h-4 text-rose-500" />
    if (status === 'substituted') return <ArrowRightLeft className="w-4 h-4 text-amber-500" />
    return <Truck className="w-4 h-4 text-teal-500" />
  }

  const canView = can('shortage:view')

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
            <span className="text-slate-500">加载中...</span>
          </div>
        </div>
      )
    }
    if (!canView) {
      return (
        <div className="py-16 text-center">
          <PackageOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">无查看权限</p>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {active.map((s) => {
          const drug = drugMap[s.drugId]
          const affected = affectedPatients(s.id)
          const restockKey = `restock-${s.id}`
          const subKey = `add-sub-${s.id}`
          return (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                s.status === 'shortage' ? 'border-rose-200' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 shrink-0 ${
                      s.status === 'shortage' ? 'bg-rose-50' : 'bg-amber-50'
                    }`}
                  >
                    {statusIcon(s.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{drug?.name || '未知药品'}</span>
                      <span className="text-xs text-slate-400">{drug?.specification}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === 'shortage'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {SHORTAGE_STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>
                        缺货数量：{s.shortageQuantity}
                        {drug?.unit || '盒'}
                      </span>
                      <span>预计到货：{s.estimatedArrivalDate || '待定'}</span>
                      <span>登记日期：{s.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === 'shortage' && can('shortage:edit') && (
                    <button
                      onClick={() => setShowSubModal(s.id)}
                      disabled={isSubmitting(subKey)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting(subKey) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      )}
                      登记替代
                    </button>
                  )}
                  {s.status !== 'restocked' && can('shortage:restock') && (
                    <button
                      onClick={() => handleRestock(s.id)}
                      disabled={isSubmitting(restockKey)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting(restockKey) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      确认到货
                    </button>
                  )}
                </div>
              </div>

              {affected.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1.5">受影响患者</p>
                  <div className="flex flex-wrap gap-1.5">
                    {affected.map((pid) => (
                      <span
                        key={pid}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-600"
                      >
                        {patientMap[pid]?.name || pid}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {s.substitutes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1.5">替代方案</p>
                  {s.substitutes.map((sub) => {
                    const subDrug = drugMap[sub.substituteDrugId]
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 text-sm bg-amber-50 rounded-lg p-2.5 mb-1.5"
                      >
                        <span className="text-slate-500 line-through">{drug?.name}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium text-amber-700">{subDrug?.name}</span>
                        <span className="text-xs text-slate-400">({subDrug?.specification})</span>
                        <span className="text-xs text-amber-600 ml-2">原因：{sub.reason}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {active.length === 0 && (
          <div className="py-16 text-center">
            <PackageOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">暂无缺货记录</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">缺货管理</h1>
          <p className="text-sm text-slate-400 mt-1">登记缺货、替代药品和到货通知</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {(['', 'shortage', 'substituted'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  filter === s
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {s === '' ? '进行中' : SHORTAGE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {can('shortage:create') && (
            <button
              onClick={() => setShowShortageModal(true)}
              disabled={isSubmitting('add-shortage')}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting('add-shortage') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              登记缺货
            </button>
          )}
        </div>
      </div>

      {renderContent()}

      <Modal open={showShortageModal} onClose={() => setShowShortageModal(false)} title="登记缺货">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">缺货药品</label>
            <select
              value={shortageDrugId}
              onChange={(e) => setShortageDrugId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">选择药品</option>
              {drugs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}（{d.specification}）当前库存：{d.stock}
                  {d.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">缺货数量</label>
              <input
                type="number"
                value={shortageQty}
                onChange={(e) => setShortageQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">预计到货日期</label>
              <input
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowShortageModal(false)}
              disabled={isSubmitting('add-shortage')}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleAddShortage}
              disabled={isSubmitting('add-shortage')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting('add-shortage') && <Loader2 className="w-4 h-4 animate-spin" />}
              确认登记
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showSubModal} onClose={() => setShowSubModal(null)} title="登记替代药品">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">替代药品</label>
            <select
              value={subDrugId}
              onChange={(e) => setSubDrugId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">选择替代药品</option>
              {drugs
                .filter((d) => d.stock > 0)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}（{d.specification}）库存：{d.stock}
                    {d.unit}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">替代原因</label>
            <textarea
              value={subReason}
              onChange={(e) => setSubReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
              placeholder="请说明替代原因和注意事项"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">通知患者</label>
            <div className="flex flex-wrap gap-2">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSubPatientIds((prev) =>
                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    )
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    subPatientIds.includes(p.id)
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowSubModal(null)}
              disabled={showSubModal && isSubmitting(`add-sub-${showSubModal}`)}
              className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleAddSubstitute}
              disabled={showSubModal && isSubmitting(`add-sub-${showSubModal}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showSubModal && isSubmitting(`add-sub-${showSubModal}`) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              确认替代
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
