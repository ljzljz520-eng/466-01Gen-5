import { useParams, useNavigate } from 'react-router-dom'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ArrowLeft, Calendar, Shield, Clock, Pill, CheckCircle, AlertTriangle } from 'lucide-react'
import { DISEASE_LABELS, INSURANCE_LABELS, PRESCRIPTION_STATUS_LABELS } from '@/types'
import { useState } from 'react'

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { prescriptions, patients, drugs, loading, completePrescription } = usePharmacyStore((s) => ({
    prescriptions: s.prescriptions,
    patients: s.patients,
    drugs: s.drugs,
    loading: s.loading,
    completePrescription: s.completePrescription,
  }))
  const [isCompleting, setIsCompleting] = useState(false)

  const isLoading = loading.prescriptions || loading.global || loading.patients || loading.drugs

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="h-10 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6">
            <div className="h-5 w-20 bg-slate-100 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="text-right space-y-1.5">
                      <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const rx = prescriptions.find((p) => p.id === id)
  if (!rx) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>处方未找到</p>
        <button onClick={() => navigate('/prescriptions')} className="text-teal-600 mt-2 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  if (!can('prescription:view')) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>无权查看该处方法细</p>
        <button onClick={() => navigate('/prescriptions')} className="text-teal-600 mt-2 text-sm">
          返回列表
        </button>
      </div>
    )
  }

  const patient = patients.find((p) => p.id === rx.patientId)
  const statusColor = rx.status === 'active' ? 'bg-teal-50 text-teal-700' : rx.status === 'completed' ? 'bg-slate-50 text-slate-500' : 'bg-rose-50 text-rose-600'
  const remainingColor = rx.remainingDays <= 3 ? 'text-rose-600' : rx.remainingDays <= 7 ? 'text-amber-600' : 'text-teal-600'
  const canComplete = can('prescription:complete') && rx.status === 'active'

  const handleComplete = async () => {
    if (!id) return
    setIsCompleting(true)
    try {
      await completePrescription(id)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-800">{patient?.name || '未知患者'}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                  {PRESCRIPTION_STATUS_LABELS[rx.status]}
                </span>
              </div>
              {patient && (
                <p className="text-sm text-slate-400">
                  {DISEASE_LABELS[patient.diseaseType]} · {patient.phone}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-3xl font-bold ${remainingColor}`}>{rx.remainingDays}</span>
                <span className="text-sm text-slate-400 ml-1">天剩余</span>
              </div>
              {canComplete && (
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  标记完成
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-teal-50 p-2">
              <Shield className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">医保类型</p>
              <p className="text-sm font-medium text-slate-700">{INSURANCE_LABELS[rx.insuranceType]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-50 p-2">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">取药日期</p>
              <p className="text-sm font-medium text-slate-700">{rx.pickupDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-50 p-2">
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">登记日期</p>
              <p className="text-sm font-medium text-slate-700">{rx.createdAt}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
            <Pill className="w-4 h-4" />
            药品明细
          </h2>
          <div className="space-y-2">
            {rx.items.map((item) => {
              const drug = drugs.find((d) => d.id === item.drugId)
              const lowStock = drug && drug.stock <= drug.safetyStock
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${lowStock ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">{drug?.name || '未知药品'}</p>
                        {lowStock && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            库存预警
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {drug?.specification} · {item.dosage}
                      </p>
                      {lowStock && drug && (
                        <p className="text-xs text-amber-600 mt-1">
                          当前库存 {drug.stock}{drug.unit}，安全库存 {drug.safetyStock}{drug.unit}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        剩余 <span className={item.remainingQuantity <= 5 ? 'text-rose-600 font-semibold' : ''}>{item.remainingQuantity}</span> {drug?.unit || '盒'}
                      </p>
                      <p className="text-xs text-slate-400">处方量 {item.quantity}{drug?.unit || '盒'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
