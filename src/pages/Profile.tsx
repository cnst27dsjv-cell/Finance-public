import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import './Profile.css'

interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  reward: number
  condition: (state: ReturnType<typeof useUserStore.getState>) => boolean
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_trade',
    name: '初入市场',
    description: '完成第一笔交易',
    icon: '📈',
    reward: 50,
    condition: s => s.transactions.length > 0,
  },
  {
    id: 'first_profit',
    name: '初次盈利',
    description: '完成第一笔盈利交易',
    icon: '💰',
    reward: 100,
    condition: s => s.profitableSells > 0,
  },
  {
    id: 'learning_1',
    name: '学习达人',
    description: '完成第一章学习',
    icon: '📚',
    reward: 200,
    condition: s => s.completedCourses.includes('L1-1'),
  },
  {
    id: 'diversified',
    name: '分散投资',
    description: '同时持有3种以上资产',
    icon: '🎯',
    reward: 150,
    condition: s => s.positions.length >= 3,
  },
  {
    id: 'profit_10',
    name: '小有斩获',
    description: '累计收益超过10%',
    icon: '🌟',
    reward: 300,
    condition: s => {
      const posVal = s.positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
      return ((s.availableFund + posVal - 100000) / 100000) * 100 >= 10
    },
  },
  {
    id: 'profit_20',
    name: '投资新星',
    description: '累计收益超过20%',
    icon: '⭐',
    reward: 500,
    condition: s => {
      const posVal = s.positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
      return ((s.availableFund + posVal - 100000) / 100000) * 100 >= 20
    },
  },
]

interface SkillDef {
  id: string
  name: string
  condition: (hasCompleted: (id: string) => boolean) => boolean
}

const SKILL_DEFS: SkillDef[] = [
  { id: 'savings', name: '储蓄入门', condition: h => h('L1-1') },
  { id: 'bond', name: '债券基础', condition: h => h('L1-3') },
  { id: 'fund', name: '基金基础', condition: h => ['L2-1', 'L2-2', 'L2-3', 'L2-4'].every(id => h(id)) },
  { id: 'stock', name: '股票入门', condition: h => ['L3-1', 'L3-2', 'L3-3', 'L3-4'].every(id => h(id)) },
  { id: 'tech', name: '技术分析', condition: h => h('L3-3') },
  { id: 'quant', name: '量化入门', condition: h => h('L4-3') },
]

function Profile() {
  const {
    level,
    experience,
    gold,
    transactions,
    availableFund,
    positions,
    unlockedAchievements,
    unlockAchievement,
    hasCompletedCourse,
    reset,
    canReset,
    addFund,
    spendGold,
    lastResetTime,
  } = useUserStore()

  const expNeeded = level * 100
  const positionsValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0)
  const totalAsset = availableFund + positionsValue
  const profitRate = ((totalAsset - 100000) / 100000) * 100

  // 自动解锁成就并发放奖励
  useEffect(() => {
    const state = useUserStore.getState()
    ACHIEVEMENT_DEFS.forEach(def => {
      if (!state.unlockedAchievements.includes(def.id) && def.condition(state)) {
        unlockAchievement(def.id, def.reward)
      }
    })
  })

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
            {SKILL_DEFS.map((skill, index) => {
              const unlocked = skill.condition(hasCompletedCourse)
              return (
                <motion.div
                  key={skill.id}
                  className={`skill-card ${unlocked ? '' : 'locked'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="skill-icon">
                    {unlocked ? '✓' : '🔒'}
                  </div>
                  <span className="skill-name">{skill.name}</span>
                  <div className="skill-progress">
                    <div
                      className="skill-fill"
                      style={{ width: unlocked ? '100%' : '0%' }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section className="achievements-section">
          <h2>🏆 成就</h2>
          <p className="achievements-hint">达成条件后自动解锁并获得金币奖励</p>
          <div className="achievements-grid">
            {ACHIEVEMENT_DEFS.map((achievement, index) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id)
              return (
                <motion.div
                  key={achievement.id}
                  className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={isUnlocked ? { scale: 1.05 } : {}}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                  </div>
                  <div className={`achievement-reward ${isUnlocked ? 'claimed' : ''}`}>
                    {isUnlocked ? '✓ 已获得' : `+${achievement.reward} 🪙`}
                  </div>
                </motion.div>
              )
            })}
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
