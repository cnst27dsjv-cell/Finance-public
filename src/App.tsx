import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Learning from './pages/Learning'
import Simulator from './pages/Simulator'
import QuantLab from './pages/QuantLab'
import Profile from './pages/Profile'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
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
