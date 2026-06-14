import { useToastStore } from '@/store/useToastStore'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  success: { Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  error: { Icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  warning: { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { Icon: Info, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((t) => {
        const { Icon, color, bg, border } = iconMap[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-2 fade-in duration-200',
              bg, border
            )}
            style={{ animation: 'slideInRight 0.2s ease-out' }}
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', color)} />
            <div className="flex-1 text-sm text-slate-700 pt-0.5">{t.message}</div>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5 rounded hover:bg-white/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
