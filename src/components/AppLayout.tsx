import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Bell, PackageOpen, Pill, Menu, X,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/prescriptions', icon: ClipboardList, label: '处方登记' },
  { to: '/reminders', icon: Bell, label: '续方提醒' },
  { to: '/shortage', icon: PackageOpen, label: '缺货管理' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-56'
        } flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100">
          <Pill className="w-7 h-7 text-teal-600 shrink-0" />
          {!collapsed && (
            <span className="text-base font-bold text-slate-800 whitespace-nowrap tracking-tight">
              慢病配药台
            </span>
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
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
