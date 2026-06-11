import { useParams, useNavigate } from 'react-router-dom'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { ArrowLeft, Calendar, Shield, Clock, Pill } from 'lucide-react'
import { DISEASE_LABELS, INSURANCE_LABELS, PRESCRIPTION_STATUS_LABELS } from '@/types'

export default function PrescriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { prescriptions, patients, drugs } = usePharmacyStore()

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

  const patient = patients.find((p) => p.id === rx.patientId)
  const statusColor = rx.status === 'active' ? 'bg-teal-50 text-teal-700' : rx.status === 'completed' ? 'bg-slate-50 text-slate-500' : 'bg-rose-50 text-rose-600'
  const remainingColor = rx.remainingDays <= 3 ? 'text-rose-600' : rx.remainingDays <= 7 ? 'text-amber-600' : 'text-teal-600'

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
            <div className="text-right">
              <span className={`text-3xl font-bold ${remainingColor}`}>{rx.remainingDays}</span>
              <span className="text-sm text-slate-400 ml-1">天剩余</span>
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
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{drug?.name || '未知药品'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drug?.specification} · {item.dosage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      剩余 <span className={item.remainingQuantity <= 5 ? 'text-rose-600' : ''}>{item.remainingQuantity}</span> {drug?.unit || '盒'}
                    </p>
                    <p className="text-xs text-slate-400">处方量 {item.quantity}{drug?.unit || '盒'}</p>
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
