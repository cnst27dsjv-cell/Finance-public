import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import './Login.css'

type Tab = 'signin' | 'signup'

function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, enterGuestMode } = useAuthStore()

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (tab === 'signin') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      } else {
        navigate('/')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error)
      } else {
        setSuccess('注册成功！请检查邮箱完成验证后登录。')
        setTab('signin')
      }
    }
    setLoading(false)
  }

  const handleGuest = () => {
    enterGuestMode()
    navigate('/')
  }

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="login-logo">
          <span className="login-logo-icon">💰</span>
          <span className="login-logo-text">InvestQuest</span>
        </div>
        <p className="login-tagline">在游戏中学习投资，成为投资达人</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(''); setSuccess('') }}
          >
            登录
          </button>
          <button
            className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); setSuccess('') }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? '至少 6 位' : '••••••••'}
              required
              minLength={6}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                className="login-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? '请稍候…' : tab === 'signin' ? '登录' : '创建账号'}
          </button>
        </form>

        <div className="login-divider">
          <span>或</span>
        </div>

        <button className="login-btn-guest" onClick={handleGuest}>
          以游客身份体验
        </button>

        <p className="login-guest-note">游客数据仅保存在本设备，注册后可永久保存进度</p>
      </motion.div>
    </div>
  )
}

export default Login
