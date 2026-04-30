import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import './Layout.css'

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/learning', label: '学习中心', icon: '📚' },
  { path: '/simulator', label: '投资模拟', icon: '📈' },
  { path: '/quant-lab', label: '量化实验室', icon: '🔬' },
  { path: '/profile', label: '我的成就', icon: '🏆' },
]

function Layout() {
  const location = useLocation()
  const { level, gold, experience, positions } = useUserStore()

  const totalPL = positions.reduce((sum, p) => {
    const pl = (p.currentPrice - p.avgCost) * p.quantity
    return sum + pl
  }, 0)

  const expNeeded = level * 100
  const expPercent = (experience / expNeeded) * 100

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💰</span>
            <span className="logo-text">InvestQuest</span>
          </div>

          <nav className="nav">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div
                    className="nav-indicator"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="status-item status-level">
            <span className="status-icon">⭐</span>
            <span className="status-label">等级</span>
            <span className="status-value">{level}</span>
            <div className="exp-bar">
              <div className="exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </div>

          <div className="status-item status-gold">
            <span className="status-icon">🪙</span>
            <span className="status-label">金币</span>
            <span className="status-value">{gold.toLocaleString()}</span>
          </div>

          <div className={`status-item status-pnl ${totalPL >= 0 ? 'positive' : 'negative'}`}>
            <span className="status-icon">{totalPL >= 0 ? '📈' : '📉'}</span>
            <span className="status-label">持仓</span>
            <span className="status-value">
              {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
