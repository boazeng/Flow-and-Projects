import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CashflowPage from './pages/CashflowPage'
import ParkingProjectDetailPage from './pages/ParkingProjectDetailPage'
import SystemPage from './pages/SystemPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CashflowPage />} />
        <Route path="/parking/projects/:projectId" element={<ParkingProjectDetailPage />} />
        <Route path="/system" element={<SystemPage />} />
      </Routes>
    </BrowserRouter>
  )
}
