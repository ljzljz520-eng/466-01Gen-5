import { useState } from 'react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { DISEASE_LABELS, INSURANCE_LABELS } from '@/types'
import type { DiseaseType, InsuranceType } from '@/types'

interface DrugEntry {
  drugId: string
  quantity: number
  dosage: string
  remainingQuantity: number
}

export default function NewPrescription() {
  const { patients, drugs, addPatient, addPrescription } = usePharmacyStore()
  const navigate = useNavigate()

  const [existingPatient, setExistingPatient] = useState('')
  const [newName, setNewName] = useState('')
  const [newIdCard, setNewIdCard] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newDisease, setNewDisease] = useState<DiseaseType>('hypertension')
  const [insurance, setInsurance] = useState<InsuranceType>('urban_employee')
  const [remainingDays, setRemainingDays] = useState(30)
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10))
  const [drugEntries, setDrugEntries] = useState<DrugEntry[]>([
    { drugId: '', quantity: 1, dosage: '', remainingQuantity: 30 },
  ])
  const [useNewPatient, setUseNewPatient] = useState(false)

  const filteredDrugs = drugs.filter((d) => d.stock > 0)

  const addDrugEntry = () => {
    setDrugEntries([...drugEntries, { drugId: '', quantity: 1, dosage: '', remainingQuantity: 30 }])
  }

  const removeDrugEntry = (idx: number) => {
    if (drugEntries.length <= 1) return
    setDrugEntries(drugEntries.filter((_, i) => i !== idx))
  }

  const updateDrugEntry = (idx: number, field: keyof DrugEntry, value: string | number) => {
    const updated = [...drugEntries]
    updated[idx] = { ...updated[idx], [field]: value }
    setDrugEntries(updated)
  }

  const handleSubmit = () => {
    let patientId = existingPatient
    if (useNewPatient) {
      if (!newName || !newPhone) return
      patientId = addPatient({ name: newName, idCard: newIdCard, phone: newPhone, diseaseType: newDisease })
    }
    if (!patientId) return

    const validItems = drugEntries.filter((e) => e.drugId)
    if (validItems.length === 0) return

    addPrescription({
      patientId,
      insuranceType: insurance,
      remainingDays,
      pickupDate,
      status: 'active',
      items: validItems.map((e) => ({
        drugId: e.drugId,
        quantity: e.quantity,
        dosage: e.dosage,
        remainingQuantity: e.remainingQuantity,
      })),
    })

    navigate('/prescriptions')
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

      <h1 className="text-2xl font-bold text-slate-800 mb-6">新增处方</h1>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">患者信息</h2>
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setUseNewPatient(false)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                !useNewPatient ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              选择已有患者
            </button>
            <button
              type="button"
              onClick={() => setUseNewPatient(true)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                useNewPatient ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              新增患者
            </button>
          </div>

          {useNewPatient ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">姓名</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">身份证号</label>
                <input
                  type="text"
                  value={newIdCard}
                  onChange={(e) => setNewIdCard(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="请输入身份证号"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">手机号</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">慢病类型</label>
                <select
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value as DiseaseType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {Object.entries(DISEASE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <select
              value={existingPatient}
              onChange={(e) => setExistingPatient(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">请选择患者</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {DISEASE_LABELS[p.diseaseType]} — {p.phone}
                </option>
              ))}
            </select>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">处方信息</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">医保类型</label>
              <select
                value={insurance}
                onChange={(e) => setInsurance(e.target.value as InsuranceType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {Object.entries(INSURANCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">剩余天数</label>
              <input
                type="number"
                value={remainingDays}
                onChange={(e) => setRemainingDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">取药日期</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-600">药品明细</h2>
            <button
              onClick={addDrugEntry}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加药品
            </button>
          </div>
          <div className="space-y-3">
            {drugEntries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {idx === 0 && <label className="block text-xs text-slate-500 mb-1">药品</label>}
                  <select
                    value={entry.drugId}
                    onChange={(e) => updateDrugEntry(idx, 'drugId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">选择药品</option>
                    {filteredDrugs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}（{d.specification}）库存：{d.stock}{d.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs text-slate-500 mb-1">数量</label>}
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => updateDrugEntry(idx, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    min={1}
                  />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className="block text-xs text-slate-500 mb-1">用法用量</label>}
                  <input
                    type="text"
                    value={entry.dosage}
                    onChange={(e) => updateDrugEntry(idx, 'dosage', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="如：每日1次，每次1片"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs text-slate-500 mb-1">剩余药量</label>}
                  <input
                    type="number"
                    value={entry.remainingQuantity}
                    onChange={(e) => updateDrugEntry(idx, 'remainingQuantity', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    min={0}
                  />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="block text-xs text-slate-500 mb-1">&nbsp;</label>}
                  <button
                    onClick={() => removeDrugEntry(idx)}
                    disabled={drugEntries.length <= 1}
                    className="p-2 text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium"
          >
            提交处方
          </button>
        </div>
      </div>
    </div>
  )
}
