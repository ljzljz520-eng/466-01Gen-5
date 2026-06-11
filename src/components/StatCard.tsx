import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  icon: ReactNode
  color: 'teal' | 'amber' | 'rose' | 'blue'
  subtitle?: string
  trend?: 'up' | 'down'
}

const colorMap = {
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-100 text-teal-600', border: 'border-teal-200' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', border: 'border-amber-200' },
  rose: { bg: 'bg-rose-50', icon: 'bg-rose-100 text-rose-600', border: 'border-rose-200' },
  blue: { bg: 'bg-sky-50', icon: 'bg-sky-100 text-sky-600', border: 'border-sky-200' },
}

export default function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div
      className={`${c.bg} ${c.border} border rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${c.icon} rounded-lg p-2.5`}>{icon}</div>
      </div>
    </div>
  )
}
