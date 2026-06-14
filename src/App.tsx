import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { usePharmacyStore } from '@/store/usePharmacyStore'
import { usePermissions } from '@/hooks/usePermissions'
import AppLayout from '@/components/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Prescriptions from '@/pages/Prescriptions'
import NewPrescription from '@/pages/NewPrescription'
import PrescriptionDetail from '@/pages/PrescriptionDetail'
import Reminders from '@/pages/Reminders'
import Shortage from '@/pages/Shortage'
import AuditLogs from '@/pages/AuditLogs'
import ToastContainer from '@/components/Toast'
import { Loader2 } from 'lucide-react'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const currentUser = usePharmacyStore((s) => s.currentUser)
  const initialized = usePharmacyStore((s) => s.initialized)
  if (!initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500">系统初始化中...</p>
        </div>
      </div>
    )
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RequirePermission({ permission, children }: { permission: import('@/types').PermissionType; children: React.ReactNode }) {
  const { can } = usePermissions()
  if (!can(permission)) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">访问受限</h3>
          <p className="text-sm text-slate-500">您的角色没有权限访问此功能</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/prescriptions" element={
          <RequirePermission permission="prescription:view"><Prescriptions /></RequirePermission>
        } />
        <Route path="/prescriptions/new" element={
          <RequirePermission permission="prescription:create"><NewPrescription /></RequirePermission>
        } />
        <Route path="/prescriptions/:id" element={
          <RequirePermission permission="prescription:view"><PrescriptionDetail /></RequirePermission>
        } />
        <Route path="/reminders" element={
          <RequirePermission permission="reminder:view"><Reminders /></RequirePermission>
        } />
        <Route path="/shortage" element={
          <RequirePermission permission="shortage:view"><Shortage /></RequirePermission>
        } />
        <Route path="/audit" element={
          <RequirePermission permission="audit:view"><AuditLogs /></RequirePermission>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const init = usePharmacyStore((s) => s.init)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    init().finally(() => setBooting(false))
  }, [init])

  if (booting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500">正在启动药房管理系统...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <AppRoutes />
      <ToastContainer />
    </Router>
  )
}
