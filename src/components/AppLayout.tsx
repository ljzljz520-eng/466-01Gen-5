import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Bell, PackageOpen, Pill, Menu, X, FileText, LogOut, RotateCcw, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_LABELS } from '@/types'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const currentUser = usePharmacyStore((s) => s.currentUser)
  const logout = usePharmacyStore((s) => s.logout)
  const resetAllData = usePharmacyStore((s) => s.resetAllData)
  const { can, role } = usePermissions()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '工作台', perm: 'prescription:view' as const },
    { to: '/prescriptions', icon: ClipboardList, label: '处方登记', perm: 'prescription:view' as const },
    { to: '/reminders', icon: Bell, label: '续方提醒', perm: 'reminder:view' as const },
    { to: '/shortage', icon: PackageOpen, label: '缺货管理', perm: 'shortage:view' as const },
    { to: '/audit', icon: FileText, label: '审计日志', perm: 'audit:view' as const },
  ].filter((item) => can(item.perm))

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleReset = async () => {
    if (!confirm('确定要重置所有数据吗？此操作不可撤销！')) return
    try {
      await resetAllData()
      setUserMenuOpen(false)
    } catch {
      /* error already shown by toast */
    }
  }

  const roleColor = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    pharmacist: 'bg-teal-50 text-teal-700 border-teal-200',
    cashier: 'bg-sky-50 text-sky-700 border-sky-200',
    viewer: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-56'
        } flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
            <Pill className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-base font-bold text-slate-800 whitespace-nowrap tracking-tight block truncate">
                慢病配药台
              </span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">社区药房数字化系统</span>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-4 lg:px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm text-slate-400 hidden sm:block">
              社区药房慢病管理系统 · v1.0
            </h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                role === 'admin' ? 'from-rose-400 to-pink-500' :
                role === 'pharmacist' ? 'from-teal-400 to-emerald-500' :
                role === 'cashier' ? 'from-sky-400 to-blue-500' :
                'from-amber-400 to-orange-500'
              } flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                {currentUser?.name?.slice(0, 1) || '?'}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{currentUser?.name}</div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded border inline-block mt-0.5 ${roleColor[role || 'viewer']}`}>
                  {role ? ROLE_LABELS[role] : '未登录'}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-20 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800">{currentUser?.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">@{currentUser?.username}</div>
                    <div className={`text-xs inline-block mt-2 px-2 py-0.5 rounded border ${roleColor[role || 'viewer']}`}>
                      {role ? ROLE_LABELS[role] : '-'}
                    </div>
                  </div>
                  {can('system:manage') && (
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重置演示数据
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
