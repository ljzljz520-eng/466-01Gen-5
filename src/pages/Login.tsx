import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { useToast } from '@/hooks/useToast'


interface DemoAccount {
  username: string
  password: string
  role: string
  name: string
  description: string
  color: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: 'admin', password: '123456', role: '系统管理员', name: '系统管理员', description: '拥有所有权限，查看审计日志', color: 'from-rose-500 to-pink-500' },
  { username: 'pharmacist1', password: '123456', role: '执业药师', name: '张药师', description: '处方、缺货、提醒全功能', color: 'from-teal-500 to-emerald-500' },
  { username: 'cashier1', password: '123456', role: '收费窗口', name: '王收费', description: '查看处方、确认回执', color: 'from-sky-500 to-blue-500' },
  { username: 'viewer1', password: '123456', role: '只读访客', name: '赵视察', description: '仅可查询浏览', color: 'from-amber-500 to-orange-500' },
]

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const currentUser = usePharmacyStore((s) => s.currentUser)
  const login = usePharmacyStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) navigate('/', { replace: true })
  }, [currentUser, navigate])

  const handleLogin = async (u?: string, p?: string) => {
    const uname = u ?? username
    const pwd = p ?? password
    if (!uname.trim() || !pwd.trim()) {
      toast.warning('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      await login(uname.trim(), pwd.trim())
      setTimeout(() => navigate('/', { replace: true }), 300)
    } catch {
      /* toast is shown by store */
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (acc: DemoAccount) => {
    setUsername(acc.username)
    setPassword(acc.password)
    await handleLogin(acc.username, acc.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/20">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">慢病配药台</h1>
              <p className="text-sm text-slate-500">社区药房数字化管理系统</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-4">
            让窗口配药更高效<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
              彻底告别纸条记录
            </span>
          </h2>
          <p className="text-slate-500 leading-relaxed mb-6">
            处方登记、智能续方提醒、缺货替代登记和到货通知全流程数字化管理，
            专为高血压、糖尿病等慢病患者长期配药需求设计。
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '处方登记', value: '完整患者档案+多药品明细' },
              { label: '三级提醒', value: '7/3/1天自动续方预警' },
              { label: '缺货管理', value: '替代方案+患者等待队列' },
              { label: '审计追踪', value: '21种操作全记录' },
            ].map((it) => (
              <div key={it.label} className="p-3 rounded-xl bg-white/60 backdrop-blur border border-white">
                <p className="text-sm font-semibold text-teal-700">{it.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{it.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">慢病配药台</span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-1">账号登录</h3>
          <p className="text-sm text-slate-400 mb-6">请登录以访问药房管理系统</p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={loading}
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />登录中...</>
              ) : (
                <><LogIn className="w-4 h-4" />登 录</>
              )}
            </button>
          </form>

          <div>
            <p className="text-xs text-slate-400 mb-2.5 flex items-center gap-2">
              <span className="w-8 h-px bg-slate-200" />
              演示账号（一键登录）
              <span className="flex-1 h-px bg-slate-200" />
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                  className="group text-left p-2.5 rounded-xl border border-slate-100 hover:border-transparent hover:shadow-md transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{acc.role.slice(0, 1)}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{acc.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">{acc.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
