import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import './Home.css'

function Home() {
  const { level, experience, gold, availableFund, positions } = useUserStore()

  // TODO: 本地调试用，临时强制解锁
  const isQuantUnlocked = true // ['L3-1', 'L3-2', 'L3-3', 'L3-4'].every(id => hasCompletedCourse(id))

  const features = [
    {
      icon: '📚',
      title: '学习系统',
      description: '从零基础开始，阶梯式学习投资知识',
      path: '/learning',
      color: '#8BA3C5',   /* Frost Blue */
    },
    {
      icon: '📈',
      title: '投资模拟',
      description: '模拟真实市场，练习各种投资操作',
      path: '/simulator',
      color: '#495B7D',   /* Steel */
    },
    {
      icon: '🔬',
      title: '量化实验室',
      description: '编写量化策略，验证投资想法',
      path: '/quant-lab',
      color: '#23354D',   /* Storm */
      locked: !isQuantUnlocked,
    },
  ]

  const expNeeded = level * 100
  const positionsValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
  const totalAsset = availableFund + positionsValue

  return (
    <div className="home">
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="hero-title">
          欢迎来到 <span className="highlight">InvestQuest</span>
        </h1>
        <p className="hero-subtitle">
          在游戏中学习投资，从新手成长为投资达人
        </p>
      </motion.div>

      <motion.div
        className="account-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="account-card main-asset">
          <div className="account-label">总资产</div>
          <div className="account-value">¥{totalAsset.toLocaleString()}</div>
          <div className="account-detail">
            可用 {availableFund.toLocaleString()} + 持仓 {positionsValue.toLocaleString()}
          </div>
        </div>

        <div className="account-row">
          <div className="account-card">
            <div className="account-label">等级</div>
            <div className="account-value level">Lv.{level}</div>
            <div className="exp-progress">
              <div
                className="exp-progress-fill"
                style={{ width: `${(experience / expNeeded) * 100}%` }}
              />
              <span className="exp-text">{experience}/{expNeeded} 经验</span>
            </div>
          </div>

          <div className="account-card">
            <div className="account-label">金币</div>
            <div className="account-value gold">🪙 {gold.toLocaleString()}</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.path}
            className={`feature-card ${feature.locked ? 'locked' : ''}`}
            style={{ borderColor: feature.color }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={feature.locked ? {} : { y: -5 }}
          >
            {feature.locked && <div className="lock-badge">🔒 已锁定</div>}
            <div className="feature-icon" style={{ backgroundColor: `${feature.color}20` }}>
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>
            {feature.locked ? (
              <div className="feature-btn disabled">完成前置学习解锁</div>
            ) : (
              <Link to={feature.path} className="feature-btn" style={{ backgroundColor: feature.color }}>
                进入
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="quick-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="section-title">快速开始</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>学习基础知识</h4>
              <p>完成学习中心的课程，掌握投资入门知识</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>模拟投资练习</h4>
              <p>使用虚拟资金进行买卖操作，熟悉投资流程</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>挑战量化策略</h4>
              <p>学习编写量化策略，验证你的投资想法</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Home
