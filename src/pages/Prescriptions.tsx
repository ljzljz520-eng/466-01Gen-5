import { usePharmacyStore } from '@/store/usePharmacyStore'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { DISEASE_LABELS, INSURANCE_LABELS, PRESCRIPTION_STATUS_LABELS } from '@/types'
import type { DiseaseType, InsuranceType } from '@/types'

export default function Prescriptions() {
  const { prescriptions, patients } = usePharmacyStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterDisease, setFilterDisease] = useState<DiseaseType | ''>('')
  const [filterInsurance, setFilterInsurance] = useState<InsuranceType | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]))

  const filtered = prescriptions.filter((rx) => {
    const patient = patientMap[rx.patientId]
    if (!patient) return false
    if (search && !patient.name.includes(search) && !patient.phone.includes(search)) return false
    if (filterDisease && patient.diseaseType !== filterDisease) return false
    if (filterInsurance && rx.insuranceType !== filterInsurance) return false
    return true
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">处方登记</h1>
          <p className="text-sm text-slate-400 mt-1">管理所有慢病处方信息</p>
        </div>
        <button
          onClick={() => navigate('/prescriptions/new')}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增处方
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索患者姓名或手机号"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters ? 'border-teal-500 text-teal-600 bg-teal-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
          {showFilters && (
            <div className="flex items-center gap-3 mt-3">
              <select
                value={filterDisease}
                onChange={(e) => setFilterDisease(e.target.value as DiseaseType | '')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">全部病种</option>
                {Object.entries(DISEASE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={filterInsurance}
                onChange={(e) => setFilterInsurance(e.target.value as InsuranceType | '')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">全部医保</option>
                {Object.entries(INSURANCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400">暂无处方记录</div>
          )}
          {filtered.map((rx) => {
            const patient = patientMap[rx.patientId]
            if (!patient) return null
            const statusColor = rx.status === 'active' ? 'bg-teal-50 text-teal-700' : rx.status === 'completed' ? 'bg-slate-50 text-slate-500' : 'bg-rose-50 text-rose-600'
            const remainingColor = rx.remainingDays <= 3 ? 'text-rose-600' : rx.remainingDays <= 7 ? 'text-amber-600' : 'text-teal-600'
            return (
              <div
                key={rx.id}
                onClick={() => navigate(`/prescriptions/${rx.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-25 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {patient.name.slice(-1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{patient.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                      {PRESCRIPTION_STATUS_LABELS[rx.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
                      {DISEASE_LABELS[patient.diseaseType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{INSURANCE_LABELS[rx.insuranceType]}</span>
                    <span>·</span>
                    <span>取药日期：{rx.pickupDate}</span>
                    <span>·</span>
                    <span>药品种类：{rx.items.length}种</span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-4">
                  <div>
                    <span className={`text-lg font-bold ${remainingColor}`}>{rx.remainingDays}</span>
                    <span className="text-xs text-slate-400 ml-1">天剩余</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
