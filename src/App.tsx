import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Prescriptions from '@/pages/Prescriptions'
import NewPrescription from '@/pages/NewPrescription'
import PrescriptionDetail from '@/pages/PrescriptionDetail'
import Reminders from '@/pages/Reminders'
import Shortage from '@/pages/Shortage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/prescriptions/new" element={<NewPrescription />} />
          <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/shortage" element={<Shortage />} />
        </Route>
      </Routes>
    </Router>
  )
}
