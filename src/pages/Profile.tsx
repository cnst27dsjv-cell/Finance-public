import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import './Profile.css'

const ACHIEVEMENTS = [
  {
    id: 'first_profit',
    name: '初次盈利',
    description: '完成第一笔盈利交易',
    icon: '💰',
    reward: 100,
    unlocked: false,
  },
  {
    id: 'first_trade',
    name: '初入市场',
    description: '完成第一笔交易',
    icon: '📈',
    reward: 50,
    unlocked: false,
  },
  {
    id: 'learning_1',
    name: '学习达人',
    description: '完成第一章学习',
    icon: '📚',
    reward: 200,
    unlocked: false,
  },
  {
    id: 'diversified',
    name: '分散投资',
    description: '同时持有3种以上资产',
    icon: '🎯',
    reward: 150,
    unlocked: false,
  },
  {
    id: 'profit_10',
    name: '小有斩获',
    description: '累计收益超过10%',
    icon: '🌟',
    reward: 300,
    unlocked: false,
  },
  {
    id: 'profit_20',
    name: '投资新星',
    description: '累计收益超过20%',
    icon: '⭐',
    reward: 500,
    unlocked: false,
  },
]

const SKILLS = [
  { id: 'savings', name: '储蓄入门', level: 1, maxLevel: 1, unlocked: true },
  { id: 'fund', name: '基金基础', level: 0, maxLevel: 1, unlocked: false },
  { id: 'stock', name: '股票入门', level: 0, maxLevel: 1, unlocked: false },
  { id: 'bond', name: '债券基础', level: 0, maxLevel: 1, unlocked: false },
  { id: 'tech', name: '技术分析', level: 0, maxLevel: 1, unlocked: false },
  { id: 'quant', name: '量化入门', level: 0, maxLevel: 1, unlocked: false },
]

function Profile() {
  const { 
    level, 
    experience, 
    gold, 
    transactions,
    availableFund,
    positions,
    reset,
    canReset,
    addFund,
    spendGold,
    lastResetTime
  } = useUserStore()

  const expNeeded = level * 100
  const positionsValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
  const totalAsset = availableFund + positionsValue
  const profitRate = ((totalAsset - 100000) / 100000) * 100

  const getCooldownText = () => {
    if (!lastResetTime || canReset()) return ''
    const remaining = 24 * 60 * 60 * 1000 - (Date.now() - lastResetTime)
    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
    return `冷却中: ${hours}小时${minutes}分钟`
  }

  const handleExchange = () => {
    if (gold >= 100) {
      spendGold(100)
      addFund(10000)
      alert('兑换成功！100金币兑换10,000资金')
    } else {
      alert('金币不足，需要100金币')
    }
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <motion.div
          className="avatar"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        >
          <span className="avatar-icon">👤</span>
          <span className="level-badge">Lv.{level}</span>
        </motion.div>

        <div className="user-info">
          <h1>投资新手</h1>
          <div className="exp-bar-large">
            <div
              className="exp-fill"
              style={{ width: `${(experience / expNeeded) * 100}%` }}
            />
            <span className="exp-label">{experience} / {expNeeded} 经验</span>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-icon">🪙</span>
            <span className="stat-value">{gold.toLocaleString()}</span>
            <span className="stat-label">金币</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{profitRate >= 0 ? '+' : ''}{profitRate.toFixed(1)}%</span>
            <span className="stat-label">累计收益</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <span className="stat-value">{transactions.length}</span>
            <span className="stat-label">交易次数</span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <section className="skills-section">
          <h2>🎯 技能树</h2>
          <div className="skills-grid">
            {SKILLS.map((skill, index) => (
              <motion.div
                key={skill.id}
                className={`skill-card ${skill.unlocked ? '' : 'locked'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="skill-icon">
                  {skill.unlocked ? '✓' : '🔒'}
                </div>
                <span className="skill-name">{skill.name}</span>
                <div className="skill-progress">
                  <div
                    className="skill-fill"
                    style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="achievements-section">
          <h2>🏆 成就</h2>
          <div className="achievements-grid">
            {ACHIEVEMENTS.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                </div>
                <div className="achievement-reward">
                  +{achievement.reward} 🪙
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="stats-section">
          <h2>📊 账户统计</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">初始资金</span>
              <span className="stat-value">¥100,000</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">当前总资产</span>
              <span className="stat-value">¥{totalAsset.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">累计收益</span>
              <span className={`stat-value ${profitRate >= 0 ? 'profit' : 'loss'}`}>
                {profitRate >= 0 ? '+' : ''}¥{(totalAsset - 100000).toLocaleString()}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">收益率</span>
              <span className={`stat-value ${profitRate >= 0 ? 'profit' : 'loss'}`}>
                {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </section>

        <section className="account-section">
          <h2>💼 账户管理</h2>
          <div className="account-actions">
            <div className="action-card">
              <h4>金币兑换</h4>
              <p>用金币补充投资资金</p>
              <div className="exchange-rate">
                <span>100 🪙 = ¥10,000</span>
              </div>
              <button 
                className="exchange-btn"
                onClick={handleExchange}
                disabled={gold < 100}
              >
                兑换
              </button>
            </div>
            <div className="action-card">
              <h4>重置账户</h4>
              <p>重新开始，资金回到10万</p>
              <div className="cooldown-text">{getCooldownText()}</div>
              <button 
                className="reset-btn"
                onClick={reset}
                disabled={!canReset()}
              >
                重置
              </button>
            </div>
          </div>
        </section>

        <section className="history-section">
          <h2>📜 交易记录</h2>
          {transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-icon">{tx.type === 'buy' ? '📥' : '📤'}</div>
                  <div className="tx-info">
                    <span className="tx-title">
                      {tx.type === 'buy' ? '买入' : '卖出'} {tx.name}
                    </span>
                    <span className="tx-meta">
                      {new Date(tx.timestamp).toLocaleString()} • {tx.quantity}股 @ ¥{tx.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="tx-type-badge">{tx.type === 'buy' ? '买入' : '卖出'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>暂无交易记录，去投资模拟开始你的第一笔交易吧！</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Profile
