import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { AUDIT_ACTION_LABELS, ROLE_LABELS } from '@/types'
import type { AuditActionType, AuditLog } from '@/types'
import { FileText, Search, ChevronDown, ChevronUp, Eye, Filter } from 'lucide-react'

const ENTITY_TYPE_LABELS: Record<AuditLog['entityType'], string> = {
  prescription: '处方',
  shortage: '缺货记录',
  reminder: '提醒',
  patient: '患者',
  drug: '药品',
  notification: '通知',
  waitqueue: '等待队列',
  user: '用户',
}

const ACTION_COLORS: Record<string, string> = {
  prescription_created: 'bg-teal-100 text-teal-700',
  prescription_updated: 'bg-sky-100 text-sky-700',
  prescription_completed: 'bg-emerald-100 text-emerald-700',
  shortage_registered: 'bg-amber-100 text-amber-700',
  shortage_substituted: 'bg-orange-100 text-orange-700',
  shortage_restocked: 'bg-emerald-100 text-emerald-700',
  reminder_sent: 'bg-sky-100 text-sky-700',
  reminder_confirmed: 'bg-emerald-100 text-emerald-700',
  reminder_ignored: 'bg-slate-100 text-slate-700',
  patient_created: 'bg-teal-100 text-teal-700',
  patient_updated: 'bg-sky-100 text-sky-700',
  drug_stock_adjusted: 'bg-purple-100 text-purple-700',
  inventory_deducted: 'bg-rose-100 text-rose-700',
  inventory_restocked: 'bg-emerald-100 text-emerald-700',
  waitqueue_joined: 'bg-amber-100 text-amber-700',
  waitqueue_served: 'bg-emerald-100 text-emerald-700',
  notification_sent: 'bg-sky-100 text-sky-700',
  user_login: 'bg-teal-100 text-teal-700',
  user_logout: 'bg-slate-100 text-slate-700',
}

export default function AuditLogs() {
  const { can } = usePermissions()
  const { auditLogs, loadAuditLogs, loading, showToast } = usePharmacyStore()
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<AuditActionType | ''>('')
  const [filterEntity, setFilterEntity] = useState<AuditLog['entityType'] | ''>('')
  const [filterOperator, setFilterOperator] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!can('audit:view')) {
      showToast('error', '您没有访问审计日志的权限')
      return
    }
    loadAuditLogs()
  }, [can, loadAuditLogs, showToast])

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false
    if (filterEntity && log.entityType !== filterEntity) return false
    if (filterOperator && !log.operator.includes(filterOperator)) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        log.operator.toLowerCase().includes(searchLower) ||
        AUDIT_ACTION_LABELS[log.action].toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.entityId.toLowerCase().includes(searchLower)
      )
    }
    return true
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const renderJson = (data: unknown) => {
    if (!data) return <span className="text-slate-400">无</span>
    return (
      <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto text-slate-600 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  if (!can('audit:view')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">您没有访问此页面的权限</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" />
          审计日志
        </h1>
        <p className="text-slate-500 mt-1">查看系统所有操作记录和变更历史</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索操作人、操作类型、详情..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
              showFilters
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="text-sm text-slate-500">
            共 {filteredLogs.length} 条记录
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">操作类型</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as AuditActionType | '')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">全部</option>
                {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">实体类型</label>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value as AuditLog['entityType'] | '')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">全部</option>
                {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">操作人</label>
              <input
                type="text"
                placeholder="输入操作人姓名"
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        )}
      </div>

      {loading.audit ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
            <span className="text-slate-500">加载中...</span>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无审计日志记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}`}>
                  {AUDIT_ACTION_LABELS[log.action]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium text-slate-700">{log.operator}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{ROLE_LABELS[log.operatorRole]}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{ENTITY_TYPE_LABELS[log.entityType]}</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{log.details}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-slate-600">{formatTime(log.createdAt)}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{log.entityId.slice(0, 8)}</div>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                  {expandedId === log.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {expandedId === log.id && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">变更前</h4>
                        {renderJson(log.beforeSnapshot)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">变更后</h4>
                        {renderJson(log.afterSnapshot)}
                      </div>
                    </div>

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">变更详情</h4>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          {Object.entries(log.changes).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-3 text-sm">
                              <span className="font-mono text-slate-600 shrink-0 w-32">{key}:</span>
                              <span className="text-rose-600 line-through">{JSON.stringify(value.before)}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-emerald-600">{JSON.stringify(value.after)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(log.ip || log.userAgent) && (
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {log.ip && <span>IP: {log.ip}</span>}
                        {log.userAgent && <span className="flex-1 truncate">UA: {log.userAgent}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
