import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Learning from './pages/Learning'
import Simulator from './pages/Simulator'
import QuantLab from './pages/QuantLab'
import Profile from './pages/Profile'
import Home from './pages/Home'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuthStore()
  if (loading) return <div className="auth-loading">加载中…</div>
  if (!user && !isGuest) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Home />} />
          <Route path="learning" element={<Learning />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="quant-lab" element={<QuantLab />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
