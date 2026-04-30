import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStrategyStore } from '../stores/strategyStore'
import './QuantLab.css'

function QuantLab() {
  const {
    strategies,
    activeStrategyId,
    currentStrategyCode,
    setCurrentStrategyCode,
    saveStrategy,
    deleteStrategy,
    activateStrategy,
    deactivateStrategy,
    runBacktest,
    duplicateTemplate,
    updateStrategyBacktestParams,
    globalBacktestParams,
    updateGlobalBacktestParams
  } = useStrategyStore()

  const [activeTab, setActiveTab] = useState('guide')
  const [activeCategory, setActiveCategory] = useState('all')
  const [newStrategyName, setNewStrategyName] = useState('')
  const [newStrategyDesc, setNewStrategyDesc] = useState('')
  const [isBacktesting, setIsBacktesting] = useState(false)
  const [backtestResult, setBacktestResult] = useState<any>(null)
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showParams, setShowParams] = useState(false)

  // 暂时移除解锁限制
  const isUnlocked = true

  const handleSaveNewStrategy = () => {
    if (newStrategyName && currentStrategyCode) {
      saveStrategy({
        name: newStrategyName,
        description: newStrategyDesc,
        code: currentStrategyCode,
        isTemplate: false,
        isActive: false,
        backtestParams: globalBacktestParams
      })
      setNewStrategyName('')
      setNewStrategyDesc('')
      setCurrentStrategyCode('')
      setActiveTab('strategies')
    }
  }

  const handleRunBacktest = async (strategy: any) => {
    setIsBacktesting(true)
    setBacktestResult(null)
    const result = await runBacktest(strategy.id)
    setBacktestResult(result)
    setIsBacktesting(false)
  }

  if (!isUnlocked) {
    return (
      <div className="quant-lab">
        <div className="quant-header">
          <h1>🔬 量化实验室</h1>
          <p>编写量化策略，验证你的投资想法</p>
        </div>

        <div className="locked-content">
          <motion.div
            className="lock-icon"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔒
          </motion.div>
          <h2>量化实验室已锁定</h2>
          <p>完成学习中心更多课程即可解锁</p>
        </div>
      </div>
    )
  }

  return (
    <div className="quant-lab">
      <div className="quant-header">
        <div className="header-left">
          <h1>🔬 量化实验室</h1>
          <p>编写量化策略，验证你的投资想法</p>
        </div>
        <div className="header-right">
          {activeStrategyId && (
            <div className="active-strategy-badge">
              <span className="dot"></span>
              运行中: {strategies.find(s => s.id === activeStrategyId)?.name}
            </div>
          )}
        </div>
      </div>

      <div className="quant-tabs">
        <button
          className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          📖 入门引导
        </button>
        <button
          className={`tab-btn ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          📋 策略列表
        </button>
        <button
          className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          ✏️ 策略编辑器
        </button>
        <button
          className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
          onClick={() => setActiveTab('backtest')}
        >
          📈 策略回测
        </button>
        <button
          className={`tab-btn ${activeTab === 'indicators' ? 'active' : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          📊 技术指标库
        </button>
        <button
          className={`tab-btn ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          ⚙️ 策略优化
        </button>
        <button
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          📊 策略对比
        </button>
      </div>

      <div className="quant-content">
        {activeTab === 'guide' && (
          <div className="guide-tab">
            <div className="guide-header">
              <h1>🎯 欢迎来到量化实验室！</h1>
              <p>让我带你了解如何使用量化策略进行投资</p>
            </div>

            <div className="workflow-section">
              <h2>📊 量化投资的完整流程</h2>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>📋 选择/创建策略</h3>
                    <p>从预设模板开始，或者创建你自己的策略</p>
                    <button className="step-action-btn" onClick={() => setActiveTab('strategies')}>
                      去选择策略 →
                    </button>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>✏️ 编辑策略</h3>
                    <p>根据你的想法调整策略逻辑</p>
                    <button className="step-action-btn" onClick={() => setActiveTab('editor')}>
                      去编辑策略 →
                    </button>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>📈 回测验证</h3>
                    <p>用历史数据测试策略表现</p>
                    <button className="step-action-btn" onClick={() => setActiveTab('backtest')}>
                      开始回测 →
                    </button>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>🚀 实战应用</h3>
                    <p>在模拟交易中运行策略</p>
                    <button className="step-action-btn" onClick={() => setActiveTab('strategies')}>
                      运行策略 →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="example-strategy">
              <h2>💡 策略示例：均线交叉</h2>
              <div className="strategy-diagram">
                <div className="diagram-item">
                  <div className="diagram-icon">📈</div>
                  <div className="diagram-title">买入信号</div>
                  <div className="diagram-desc">MA5上穿MA10</div>
                </div>
                <div className="diagram-arrow">→</div>
                <div className="diagram-item">
                  <div className="diagram-icon">💰</div>
                  <div className="diagram-title">执行</div>
                  <div className="diagram-desc">自动买入</div>
                </div>
                <div className="diagram-arrow">→</div>
                <div className="diagram-item">
                  <div className="diagram-icon">📉</div>
                  <div className="diagram-title">卖出信号</div>
                  <div className="diagram-desc">MA5下穿MA10</div>
                </div>
              </div>
            </div>

            <div className="quick-start">
              <h2>🚀 立即开始</h2>
              <p>推荐新手先从简单策略开始</p>
              <div className="quick-start-cards">
                <div className="quick-card" onClick={() => {
                  duplicateTemplate('template-ma-cross')
                  setActiveTab('strategies')
                }}>
                  <div className="quick-icon">📊</div>
                  <h3>均线交叉策略</h3>
                  <p>最简单的趋势策略</p>
                  <button className="quick-btn">使用这个策略</button>
                </div>
                <div className="quick-card" onClick={() => {
                  duplicateTemplate('template-rsi')
                  setActiveTab('strategies')
                }}>
                  <div className="quick-icon">⚡</div>
                  <h3>RSI超买超卖</h3>
                  <p>捕捉超跌反弹机会</p>
                  <button className="quick-btn">使用这个策略</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="strategies-tab">
            <div className="create-strategy-card">
              <h3>创建新策略</h3>
              <input
                type="text"
                placeholder="策略名称"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
              />
              <textarea
                placeholder="策略描述"
                value={newStrategyDesc}
                onChange={(e) => setNewStrategyDesc(e.target.value)}
                rows={2}
              />
              <button
                className="create-btn"
                onClick={handleSaveNewStrategy}
                disabled={!newStrategyName}
              >
                + 创建策略
              </button>
            </div>

            <div className="templates-section">
              <h3>📦 策略模板</h3>
              <div className="strategies-grid">
                {strategies.filter(s => s.isTemplate).map(strategy => (
                  <motion.div
                    key={strategy.id}
                    className="strategy-card template"
                    whileHover={{ y: -5 }}
                  >
                    <div className="strategy-header">
                      <h4>{strategy.name}</h4>
                      <span className="template-badge">模板</span>
                    </div>
                    <p className="strategy-desc">{strategy.description}</p>
                    <div className="strategy-actions">
                      <button
                        className="use-template-btn"
                        onClick={() => duplicateTemplate(strategy.id)}
                      >
                        使用模板
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="my-strategies-section">
              <h3>💼 我的策略</h3>
              {strategies.filter(s => !s.isTemplate).length === 0 ? (
                <div className="empty-state">
                  <p>还没有自己的策略，先试试使用模板吧！</p>
                </div>
              ) : (
                <div className="strategies-grid">
                  {strategies.filter(s => !s.isTemplate).map(strategy => (
                    <motion.div
                      key={strategy.id}
                      className={`strategy-card ${strategy.isActive ? 'active' : ''}`}
                      whileHover={{ y: -5 }}
                    >
                      <div className="strategy-header">
                        <h4>{strategy.name}</h4>
                        {strategy.isActive && <span className="active-badge">运行中</span>}
                      </div>
                      <p className="strategy-desc">{strategy.description}</p>
                      {strategy.performance && (
                        <div className="strategy-performance">
                          <div className="perf-item">
                            <span className="perf-label">总收益</span>
                            <span className={`perf-value ${strategy.performance.totalReturn >= 0 ? 'positive-cn' : 'negative-cn'}`}>
                              {strategy.performance.totalReturn >= 0 ? '+' : ''}{strategy.performance.totalReturn.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="strategy-actions">
                        {!strategy.isActive ? (
                          <button
                            className="activate-btn"
                            onClick={() => activateStrategy(strategy.id)}
                          >
                            运行策略
                          </button>
                        ) : (
                          <button
                            className="deactivate-btn"
                            onClick={() => deactivateStrategy()}
                          >
                            停止运行
                          </button>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => deleteStrategy(strategy.id)}
                        >
                          删除
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="editor-tab">
            <div className="editor-main">
              <h3>策略编辑器</h3>
              <textarea
                className="code-editor"
                placeholder="// 在这里编写你的策略..."
                value={currentStrategyCode}
                onChange={(e) => setCurrentStrategyCode(e.target.value)}
                rows={20}
              />
            </div>
          </div>
        )}

        {activeTab === 'backtest' && (
          <div className="backtest-tab">
            <div className="backtest-header">
              <h3>选择策略进行回测</h3>
              <button 
                className="toggle-params-btn"
                onClick={() => setShowParams(!showParams)}
              >
                {showParams ? '隐藏参数设置' : '显示参数设置'}
              </button>
            </div>

            {/* 回测参数设置 */}
            <AnimatePresence>
              {showParams && (
                <motion.div
                  className="backtest-params-section"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="params-title">
                    <h4>⚙️ 回测参数</h4>
                    <p className="params-desc">调整回测的参数设置，让结果更贴近真实交易环境</p>
                  </div>
                  
                  <div className="params-grid">
                    <div className="param-item">
                      <label>初始资金</label>
                      <div className="param-input-wrapper">
                        <span className="currency-symbol">¥</span>
                        <input
                          type="number"
                          value={globalBacktestParams.initialCapital}
                          onChange={(e) => updateGlobalBacktestParams({ initialCapital: Number(e.target.value) })}
                          min="10000"
                          step="10000"
                        />
                      </div>
                      <span className="param-hint">回测初始资金</span>
                    </div>
                    
                    <div className="param-item">
                      <label>手续费率</label>
                      <div className="param-input-wrapper">
                        <input
                          type="number"
                          value={globalBacktestParams.commissionRate}
                          onChange={(e) => updateGlobalBacktestParams({ commissionRate: Number(e.target.value) })}
                          min="0"
                          max="5"
                          step="0.01"
                        />
                        <span className="percent-symbol">%</span>
                      </div>
                      <span className="param-hint">每次交易手续费</span>
                    </div>
                    
                    <div className="param-item">
                      <label>滑点率</label>
                      <div className="param-input-wrapper">
                        <input
                          type="number"
                          value={globalBacktestParams.slippageRate}
                          onChange={(e) => updateGlobalBacktestParams({ slippageRate: Number(e.target.value) })}
                          min="0"
                          max="5"
                          step="0.01"
                        />
                        <span className="percent-symbol">%</span>
                      </div>
                      <span className="param-hint">模拟实际成交的价格偏移</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="strategies-list">
              {strategies.filter(s => !s.isTemplate).map(strategy => (
                <div key={strategy.id} className="backtest-strategy-item">
                  <div className="strategy-info-section">
                    <div>
                      <h4>{strategy.name}</h4>
                      <p>{strategy.description}</p>
                    </div>
                    <div className="strategy-params-preview">
                      <span>¥{(strategy.backtestParams?.initialCapital || 100000).toLocaleString()}</span>
                      <span>•</span>
                      <span>手续费 {(strategy.backtestParams?.commissionRate || 0.03)}%</span>
                      <span>•</span>
                      <span>滑点 {(strategy.backtestParams?.slippageRate || 0.01)}%</span>
                    </div>
                  </div>
                  <div className="strategy-actions-section">
                    <button
                      className="edit-params-btn"
                      onClick={() => {
                        // 为该策略设置为当前全局参数
                        updateStrategyBacktestParams(strategy.id, {
                          ...globalBacktestParams
                        })
                      }}
                      title="应用当前参数设置"
                    >
                      应用参数
                    </button>
                    <button
                      className="start-backtest-btn"
                      onClick={() => handleRunBacktest(strategy)}
                    >
                      开始回测
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {isBacktesting && (
              <div className="backtest-loading">
                <div className="loading-spinner"></div>
                <p>正在进行回测分析...</p>
              </div>
            )}

            {backtestResult && backtestResult.performance && (
              <div className="backtest-result">
                <h3>📊 回测结果 - {backtestResult.name}</h3>
                
                {/* 可视化图表区域 */}
                <div className="chart-section">
                  <h4>📈 收益率曲线</h4>
                  <div className="chart-container">
                    <div className="chart-y-axis">
                      <span>+50%</span>
                      <span>+25%</span>
                      <span>0%</span>
                      <span>-25%</span>
                      <span>-50%</span>
                    </div>
                    <div className="chart-area">
                      <svg width="100%" height="200" viewBox="0 0 600 200">
                        {/* X轴 */}
                        <line x1="0" y1="100" x2="580" y2="100" stroke="#ddd" strokeWidth="1" />
                        {/* 网格线 */}
                        <line x1="0" y1="50" x2="580" y2="50" stroke="#eee" strokeWidth="1" />
                        <line x1="0" y1="150" x2="580" y2="150" stroke="#eee" strokeWidth="1" />
                        
                        {/* 真实收益率曲线 */}
                        {backtestResult.performance.equityCurve && backtestResult.performance.equityCurve.length > 0 && (() => {
                          const points = backtestResult.performance.equityCurve
                          const initialEquity = points[0].equity
                          
                          const pathData = points.map((p: { time: number; equity: number }, i: number) => {
                            const x = (i / (points.length - 1)) * 580
                            const normalizedEquity = ((p.equity - initialEquity) / initialEquity) * 100
                            const y = 100 - normalizedEquity * 2
                            return `${i === 0 ? 'M' : 'L'}${x},${Math.max(0, Math.min(200, y))}`
                          }).join(' ')
                          
                          const fillData = `${pathData} L580,200 L0,200 Z`
                          
                          const finalReturn = backtestResult.performance.totalReturn || 0
                          const finalY = 100 - finalReturn * 2
                          
                          return (
                            <>
                              {/* 曲线填充区域 */}
                              <path
                                d={fillData}
                                fill={finalReturn >= 0 ? 'rgba(230, 57, 70, 0.1)' : 'rgba(42, 157, 143, 0.1)'}
                              />
                              {/* 主曲线 */}
                              <path
                                d={pathData}
                                stroke={finalReturn >= 0 ? '#e63946' : '#2a9d8f'}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {/* 起点和终点标记 */}
                              <circle cx="0" cy="100" r="5" fill="#666" />
                              <circle cx="580" cy={Math.max(0, Math.min(200, finalY))} r="6" fill={finalReturn >= 0 ? '#e63946' : '#2a9d8f'} />
                              
                              {/* 买卖点标记 */}
                              {backtestResult.performance.tradePoints && backtestResult.performance.tradePoints.map((tp: { time: number; price: number; type: 'buy' | 'sell' }, i: number) => {
                                const x = (tp.time / (points.length - 1)) * 580
                                const color = tp.type === 'buy' ? '#2a9d8f' : '#e63946'
                                return (
                                  <g key={i}>
                                    <circle cx={x} cy={tp.type === 'buy' ? 30 : 170} r="8" fill={color} />
                                    <text x={x} y={tp.type === 'buy' ? 34 : 174} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                                      {tp.type === 'buy' ? '买' : '卖'}
                                    </text>
                                  </g>
                                )
                              })}
                            </>
                          )
                        })()}
                      </svg>
                      
                      {/* X轴标签 */}
                      <div className="chart-x-axis">
                        <span>Day1</span>
                        <span>Day60</span>
                        <span>Day120</span>
                        <span>Day180</span>
                        <span>Day250</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 回撤曲线 */}
                {backtestResult.performance.drawdownCurve && backtestResult.performance.drawdownCurve.length > 0 && (
                  <div className="chart-section">
                    <h4>📉 回撤曲线</h4>
                    <div className="chart-container">
                      <div className="chart-y-axis">
                        <span>0%</span>
                        <span>-10%</span>
                        <span>-20%</span>
                        <span>-30%</span>
                        <span>-40%</span>
                      </div>
                      <div className="chart-area">
                        <svg width="100%" height="150" viewBox="0 0 600 150">
                          {/* X轴 */}
                          <line x1="0" y1="0" x2="580" y2="0" stroke="#ddd" strokeWidth="1" />
                          {/* 网格线 */}
                          <line x1="0" y1="50" x2="580" y2="50" stroke="#eee" strokeWidth="1" />
                          <line x1="0" y1="100" x2="580" y2="100" stroke="#eee" strokeWidth="1" />
                          
                          {(() => {
                            const points = backtestResult.performance.drawdownCurve
                            const pathData = points.map((p: { time: number; drawdown: number }, i: number) => {
                              const x = (i / (points.length - 1)) * 580
                              const y = Math.min(150, p.drawdown * 3.75)
                              return `${i === 0 ? 'M' : 'L'}${x},${y}`
                            }).join(' ')
                            
                            const fillData = `${pathData} L580,150 L0,150 Z`
                            
                            return (
                              <>
                                <path
                                  d={fillData}
                                  fill="rgba(230, 57, 70, 0.1)"
                                />
                                <path
                                  d={pathData}
                                  stroke="#e63946"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )
                          })()}
                        </svg>
                        <div className="chart-x-axis">
                          <span>Day1</span>
                          <span>Day60</span>
                          <span>Day120</span>
                          <span>Day180</span>
                          <span>Day250</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 关键指标 */}
                <div className="result-metrics">
                  <div className="metric-card">
                    <span className="metric-label">总收益</span>
                    <span className={`metric-value ${(backtestResult.performance.totalReturn || 0) >= 0 ? 'positive-cn' : 'negative-cn'}`}>
                      {(backtestResult.performance.totalReturn || 0) >= 0 ? '+' : ''}{(backtestResult.performance.totalReturn || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">年化收益</span>
                    <span className={`metric-value ${(backtestResult.performance.annualReturn || 0) >= 0 ? 'positive-cn' : 'negative-cn'}`}>
                      {(backtestResult.performance.annualReturn || 0) >= 0 ? '+' : ''}{(backtestResult.performance.annualReturn || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">夏普比率</span>
                    <span className="metric-value">{(backtestResult.performance.sharpeRatio || 0).toFixed(2)}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">最大回撤</span>
                    <span className="metric-value negative-cn">-{(backtestResult.performance.maxDrawdown || 0).toFixed(2)}%</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">胜率</span>
                    <span className="metric-value">{(backtestResult.performance.winRate || 0).toFixed(2)}%</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">盈亏比</span>
                    <span className="metric-value">{(backtestResult.performance.profitLossRatio || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* 额外统计信息 */}
                <div className="additional-stats">
                  <h4>📋 详细统计</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">交易次数</span>
                      <span className="stat-value">{backtestResult.performance.tradeCount || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">盈利次数</span>
                      <span className="stat-value">{Math.floor((backtestResult.performance.tradeCount || 0) / 2 * (backtestResult.performance.winRate || 0) / 100)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">亏损次数</span>
                      <span className="stat-value">{Math.ceil((backtestResult.performance.tradeCount || 0) / 2 * (1 - (backtestResult.performance.winRate || 0) / 100))}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">平均持仓天数</span>
                      <span className="stat-value">{(backtestResult.performance.avgHoldDays || 0).toFixed(1)}天</span>
                    </div>
                  </div>
                </div>

                <button className="close-result-btn" onClick={() => setBacktestResult(null)}>
                  关闭结果
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'indicators' && (
          <div className="indicators-tab">
            <div className="indicators-intro">
              <h3>📊 技术指标库</h3>
              <p>学习和理解常用的技术指标，帮助你做出更好的交易决策</p>
            </div>
            
            {/* 分类标签 */}
            <div className="indicator-categories">
              <button
                className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                全部
              </button>
              <button
                className={`category-btn ${activeCategory === 'trend' ? 'active' : ''}`}
                onClick={() => setActiveCategory('trend')}
              >
                趋势指标
              </button>
              <button
                className={`category-btn ${activeCategory === 'momentum' ? 'active' : ''}`}
                onClick={() => setActiveCategory('momentum')}
              >
                动量指标
              </button>
              <button
                className={`category-btn ${activeCategory === 'volatility' ? 'active' : ''}`}
                onClick={() => setActiveCategory('volatility')}
              >
                波动率指标
              </button>
              <button
                className={`category-btn ${activeCategory === 'volume' ? 'active' : ''}`}
                onClick={() => setActiveCategory('volume')}
              >
                成交量指标
              </button>
            </div>
            
            <div className="indicators-grid" data-category-filter={activeCategory}>
              {/* 趋势指标 */}
              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>MA (均线)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">移动平均线是最基础、最常用的技术指标，平滑了价格波动，帮助我们看清趋势方向。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>MA5</strong>（5日线）：短期趋势，敏感度高</li>
                      <li><strong>MA10</strong>（10日线）：中短期趋势</li>
                      <li><strong>MA20</strong>（20日线）：中期趋势，重要支撑/阻力</li>
                      <li><strong>MA60</strong>（60日线）：中长期趋势，"生命线"</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>金叉</strong>：短期均线上穿长期均线 → 买入信号</li>
                      <li><strong>死叉</strong>：短期均线下穿长期均线 → 卖出信号</li>
                      <li><strong>价格在均线上方</strong>：强势，考虑做多</li>
                      <li><strong>价格在均线下方</strong>：弱势，考虑做空或观望</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>MACD</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">异同移动平均线，由两条线（DIF快线、DEA慢线）和柱状图组成，用来判断趋势转变和动量强弱。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>DIF快线</strong>：短期EMA减去长期EMA</li>
                      <li><strong>DEA慢线</strong>：DIF的9日EMA</li>
                      <li><strong>MACD柱</strong>：DIF减去DEA，红色长涨，绿色长跌</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>金叉</strong>：DIF上穿DEA → 看涨</li>
                      <li><strong>死叉</strong>：DIF下穿DEA → 看跌</li>
                      <li><strong>柱背离</strong>：价格创新高但柱不创新高 → 可能回调</li>
                      <li><strong>0轴上方</strong>：强势市场</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 动量指标 */}
              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>RSI (相对强弱指数)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">衡量价格变化的速度和幅度，范围0-100，用来判断超买超卖状态。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>0-30</strong>：超卖区，可能反弹</li>
                      <li><strong>30-70</strong>：正常区，观望</li>
                      <li><strong>70-100</strong>：超买区，可能回调</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>RSI从30以下回升突破30 → 考虑买入</li>
                      <li>RSI从70以上回落跌破70 → 考虑卖出</li>
                      <li><strong>底背离</strong>：价格新低但RSI不新低 → 看涨信号</li>
                      <li><strong>顶背离</strong>：价格新高但RSI不新高 → 看跌信号</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>KDJ (随机指标)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">由K、D、J三条线组成，结合了动量和趋势概念，在震荡市场中效果很好。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>K值</strong>：快速随机值，反应敏捷</li>
                      <li><strong>D值</strong>：慢速，K的3日平均</li>
                      <li><strong>J值</strong>：3K - 2D，最敏感</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>K上穿D</strong>（金叉）在低位 → 买入信号</li>
                      <li><strong>K下穿D</strong>（死叉）在高位 → 卖出信号</li>
                      <li><strong>K、D、J均在20以下</strong>：严重超卖</li>
                      <li><strong>K、D、J均在80以上</strong>：严重超买</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 波动率指标 */}
              <div className="indicator-card detailed" data-category="volatility">
                <div className="indicator-header">
                  <h4>BOLL (布林带)</h4>
                  <span className="indicator-badge volatility">波动率</span>
                </div>
                <p className="indicator-desc">由中轨（MA20）、上轨和下轨组成，利用标准差计算波动区间，是重要的支撑阻力指标。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>中轨</strong>：20日平均线</li>
                      <li><strong>上轨</strong>：中轨 + 2倍标准差</li>
                      <li><strong>下轨</strong>：中轨 - 2倍标准差</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>价格触及下轨</strong>：获得支撑，可能反弹</li>
                      <li><strong>价格触及上轨</strong>：遇到阻力，可能回调</li>
                      <li><strong>开口收窄</strong>：波动减小，即将变盘</li>
                      <li><strong>开口扩张</strong>：趋势加强，顺势而为</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volatility">
                <div className="indicator-header">
                  <h4>ATR (平均真实波幅)</h4>
                  <span className="indicator-badge volatility">波动率</span>
                </div>
                <p className="indicator-desc">衡量价格的波动幅度，不提供买卖信号，但是判断市场活跃度和设置止损止盈的重要工具。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>ATR值变大</strong>：市场波动加剧</li>
                      <li><strong>ATR值变小</strong>：市场趋于平静</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>设置止损：入场价 - 1.5倍ATR</li>
                      <li>设置止盈：入场价 + 2倍ATR</li>
                      <li>ATR变大时减小仓位，变小时增加仓位</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 成交量指标 */}
              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>VOL (成交量)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">成交量是资金的痕迹，量价配合是技术分析的核心。放量和缩量往往是行情反转的前兆。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li><strong>放量</strong>：成交量明显放大，有资金参与</li>
                      <li><strong>缩量</strong>：成交量减少，观望情绪</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>放量上涨</strong>：上涨有动力，继续看好</li>
                      <li><strong>缩量上涨</strong>：上涨动能不足，需谨慎</li>
                      <li><strong>放量下跌</strong>：恐慌抛盘，可能见底</li>
                      <li><strong>缩量下跌</strong>：惜售情绪，可能止跌</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>OBV (能量潮)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">将成交量量化，累积计算，用来验证价格趋势的可靠性，是主力资金的"显微镜"。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>股价上涨时OBV上升 → 资金流入</li>
                      <li>股价下跌时OBV下降 → 资金流出</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li><strong>OBV创新高</strong>但价格没创新高 → 可能补涨</li>
                      <li><strong>OBV创新低</strong>但价格没创新低 → 可能补跌</li>
                      <li>价格与OBV同步 → 趋势健康</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 补充：更多趋势指标 */}
              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>EMA (指数平滑均线)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">对近期价格给更高权重，比MA更敏感，适合短线交易和趋势跟踪。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 特点</h5>
                    <ul>
                      <li>反应更快，更早捕捉趋势</li>
                      <li>适合做快线，与MA配合使用</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>SAR (抛物线转向)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">像抛物线一样的点，给出明确的趋势反转信号，是简单高效的止损止盈工具。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>价格在SAR点上方 → 看多，点为止损</li>
                      <li>价格在SAR点下方 → 看空，点为止盈</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 更多趋势指标 */}
              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>ADX (平均趋向指数)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">判断趋势强度的关键指标，不判断方向，只判断趋势的强弱，与DI+、DI-配合使用效果最佳。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>ADX &gt; 25 → 趋势强劲</li>
                      <li>ADX &lt; 20 → 趋势较弱或无趋势</li>
                      <li>ADX由下往上 → 趋势加强</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>DI+上穿DI- + ADX上升 → 买入信号</li>
                      <li>ADX在高位反转 → 注意趋势可能结束</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>CCI (顺势指标)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">衡量价格偏离平均价格的程度，专门用来对付极端行情，捕捉超买超卖和趋势反转。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>CCI &gt; 100 → 超买区域</li>
                      <li>CCI &lt; -100 → 超卖区域</li>
                      <li>-100 ~ 100 → 震荡区间</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>CCI从-100下方向上突破 → 买入</li>
                      <li>CCI从100上方向下突破 → 卖出</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volatility">
                <div className="indicator-header">
                  <h4>BOLLINGER BANDS WIDTH (带宽)</h4>
                  <span className="indicator-badge volatility">波动率</span>
                </div>
                <p className="indicator-desc">布林带上下轨距离的标准化指标，用来判断波动率大小和变盘点，是布林带系统的重要补充。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>带宽收窄 → 波动减小，即将变盘</li>
                      <li>带宽放大 → 趋势启动，波动加大</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 更多动量指标 */}
              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>WR (威廉指标)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">Larry Williams发明的经典指标，与RSI相反，0-100区间，用来判断超买超卖状态。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>WR &gt; 80 → 超卖，考虑买入</li>
                      <li>WR &lt; 20 → 超买，考虑卖出</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>WR从80上方跌破80 → 买入信号</li>
                      <li>WR从20下方突破20 → 卖出信号</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>ROC (变动率)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">衡量当前价格与N天前价格的变动百分比，是最纯粹的动量指标，直接反映涨跌速度。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>ROC &gt; 0 → 上涨动量</li>
                      <li>ROC &lt; 0 → 下跌动量</li>
                    </ul>
                  </div>
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>ROC上穿0轴 → 买入信号</li>
                      <li>ROC下穿0轴 → 卖出信号</li>
                      <li>ROC与价格背离 → 注意反转</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>MOM (动量线)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">最简单的动量指标，用当前价格减去N天前价格，直接反映价格动量的变化。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>MOM由负转正 → 买入信号</li>
                      <li>MOM由正转负 → 卖出信号</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 更多成交量指标 */}
              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>VR (成交量比率)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">衡量上涨日成交量与下跌日成交量的比率，用来判断资金活跃程度和市场热度。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>VR &gt; 180 → 过热，注意回调</li>
                      <li>VR &lt; 70 → 过冷，可能反弹</li>
                      <li>VR在低位攀升 → 资金流入</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>AMO (成交额)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">用成交金额而非成交量，更准确反映资金的真实流向，尤其在股价差异大时更有用。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>价格上涨+AMO放大 → 健康上涨</li>
                      <li>价格下跌+AMO放大 → 恐慌性抛售</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>AD (累积派发线)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">结合价格和成交量的指标，通过收盘价在当日振幅的位置加权成交量，判断资金流向。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>AD上升 → 资金流入，累积阶段</li>
                      <li>AD下降 → 资金流出，派发阶段</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volume">
                <div className="indicator-header">
                  <h4>PVT (价格成交量趋势)</h4>
                  <span className="indicator-badge volume">成交量</span>
                </div>
                <p className="indicator-desc">类似OBV，但不是简单累加成交量，而是用价格变动比例加权成交量，更精确反映资金。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>PVT上穿 → 买入信号</li>
                      <li>PVT下穿 → 卖出信号</li>
                      <li>PVT与价格背离 → 反转信号</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 更多波动率指标 */}
              <div className="indicator-card detailed" data-category="volatility">
                <div className="indicator-header">
                  <h4>STDDEV (标准差)</h4>
                  <span className="indicator-badge volatility">波动率</span>
                </div>
                <p className="indicator-desc">统计学上的波动率指标，衡量价格偏离平均值的程度，是量化投资中最常用的风险指标。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>STDDEV变大 → 波动率上升</li>
                      <li>STDDEV变小 → 波动率下降</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="volatility">
                <div className="indicator-header">
                  <h4>HISTORICAL VOLATILITY (历史波动率)</h4>
                  <span className="indicator-badge volatility">波动率</span>
                </div>
                <p className="indicator-desc">基于过去N天收益率标准差计算的年化波动率，是期权定价和风险管理的核心指标。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>比较历史波动率与当前波动率</li>
                      <li>波动率均值回归特性</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 综合指标 */}
              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>MACD HISTOGRAM (MACD柱)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">DIF减去DEA的结果，是MACD系统中最敏感的部分，柱状的变化领先于DIF和DEA。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>MACD柱由负转正 → 买盘增强</li>
                      <li>MACD柱由正转负 → 卖盘增强</li>
                      <li>柱变高 → 趋势加强</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>MA ENVELOPE (均线通道)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">在均线上下设置百分比通道，类似简易布林带，适合判断超买超卖和趋势突破。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>价格触及上轨 → 考虑卖出</li>
                      <li>价格触及下轨 → 考虑买入</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="momentum">
                <div className="indicator-header">
                  <h4>TRIX (三重指数平滑)</h4>
                  <span className="indicator-badge momentum">动量</span>
                </div>
                <p className="indicator-desc">经过三次指数平滑的指标，去除短期波动，只显示主要趋势，适合中长线趋势判断。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>📌 怎么看</h5>
                    <ul>
                      <li>TRIX &gt; 0 → 上涨趋势</li>
                      <li>TRIX &lt; 0 → 下跌趋势</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>VHF (垂直水平滤波器)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">专门用来判断市场是趋势市还是震荡市的指标，帮助选择合适的策略。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>VHF高 → 趋势市，用趋势策略</li>
                      <li>VHF低 → 震荡市，用震荡策略</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>KAMA (卡夫曼自适应均线)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">根据市场波动率自动调整参数的均线，波动大时更敏感，波动小时更平滑，非常智能。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 核心优势</h5>
                    <ul>
                      <li>自动适应不同市场环境</li>
                      <li>避免在震荡市频繁信号</li>
                      <li>趋势市能及时跟踪</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="indicator-card detailed" data-category="trend">
                <div className="indicator-header">
                  <h4>MA MULTITIMEFRAME (多周期均线)</h4>
                  <span className="indicator-badge trend">趋势</span>
                </div>
                <p className="indicator-desc">同时观察不同时间周期的均线方向，大周期定方向，小周期找入场点，效果远胜单周期。</p>
                <div className="indicator-details">
                  <div className="detail-section">
                    <h5>💡 使用技巧</h5>
                    <ul>
                      <li>日线看趋势，30分钟找入场</li>
                      <li>多个周期同向时信号最强</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="optimization-tab">
            <div className="optimization-intro">
              <h3>⚙️ 策略参数优化</h3>
              <p>通过网格搜索和敏感性分析，找到最佳策略参数组合</p>
            </div>

            {/* 选择要优化的策略 */}
            <div className="optimization-select">
              <h4>🎯 选择策略</h4>
              <div className="strategy-select-grid">
                {strategies.filter(s => !s.isTemplate).map(strategy => (
                  <div key={strategy.id} className="strategy-select-card">
                    <label className="select-label">
                      <input
                        type="radio"
                        name="optimize-strategy"
                        value={strategy.id}
                        onChange={() => {}}
                      />
                      <div className="select-strategy-info">
                        <h5>{strategy.name}</h5>
                        <p>{strategy.description}</p>
                      </div>
                    </label>
                  </div>
                ))}
                {strategies.filter(s => !s.isTemplate).length === 0 && (
                  <div className="no-strategies">
                    <p>还没有自定义策略，请先创建一个！</p>
                    <button onClick={() => setActiveTab('editor')} className="quick-btn">
                      创建策略
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 参数扫描区域 */}
            {strategies.filter(s => !s.isTemplate).length > 0 && (
              <div className="parameter-scan">
                <h4>📊 参数扫描范围</h4>
                <div className="param-grid">
                  <div className="param-item">
                    <label>移动平均线周期</label>
                    <div className="param-inputs">
                      <input type="number" defaultValue={5} min={1} max={200} />
                      <span>-</span>
                      <input type="number" defaultValue={20} min={1} max={200} />
                    </div>
                    <span className="param-range">5 - 20</span>
                  </div>
                  <div className="param-item">
                    <label>RSI超买阈值</label>
                    <div className="param-inputs">
                      <input type="number" defaultValue={65} min={50} max={90} />
                      <span>-</span>
                      <input type="number" defaultValue={80} min={50} max={90} />
                    </div>
                    <span className="param-range">65 - 80</span>
                  </div>
                  <div className="param-item">
                    <label>RSI超卖阈值</label>
                    <div className="param-inputs">
                      <input type="number" defaultValue={20} min={10} max={50} />
                      <span>-</span>
                      <input type="number" defaultValue={35} min={10} max={50} />
                    </div>
                    <span className="param-range">20 - 35</span>
                  </div>
                </div>
                
                <div className="optimization-actions">
                  <button 
                    className="optimize-btn" 
                    onClick={async () => {
                      setIsOptimizing(true)
                      setOptimizationResult(null)
                      await new Promise(r => setTimeout(r, 3000))
                      
                      const results = []
                      for (let i = 0; i < 9; i++) {
                        results.push({
                          params: `MA: ${10 + i * 2}, RSI: ${70 - i * 2}`,
                          return: Math.random() * 40 + 5,
                          drawdown: Math.random() * 25 + 5,
                          sharpe: Math.random() * 1.5 + 0.5
                        })
                      }
                      results.sort((a, b) => b.return - a.return)
                      
                      setOptimizationResult(results)
                      setIsOptimizing(false)
                    }}
                    disabled={isOptimizing}
                  >
                    {isOptimizing ? '⏳ 正在优化...' : '🚀 开始优化'}
                  </button>
                </div>
              </div>
            )}

            {/* 优化结果 */}
            {optimizationResult && (
              <div className="optimization-results">
                <h4>🏆 优化结果（按收益率排序）</h4>
                <div className="results-table">
                  <div className="table-header">
                    <span>排名</span>
                    <span>参数组合</span>
                    <span>总收益</span>
                    <span>最大回撤</span>
                    <span>夏普比率</span>
                  </div>
                  {optimizationResult.map((result: any, index: number) => (
                    <div key={index} className={`table-row ${index === 0 ? 'best-row' : ''}`}>
                      <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</span>
                      <span>{result.params}</span>
                      <span className={result.return >= 0 ? 'positive-cn' : 'negative-cn'}>{result.return.toFixed(2)}%</span>
                      <span className="negative-cn">-{result.drawdown.toFixed(2)}%</span>
                      <span>{result.sharpe.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="compare-tab">
            <div className="compare-intro">
              <h3>📊 策略对比分析</h3>
              <p>同时对比多个策略的历史表现，找到最佳策略组合</p>
            </div>

            {/* 选择要对比的策略 */}
            <div className="compare-select">
              <h4>🎯 选择要对比的策略（最多4个）</h4>
              <div className="strategy-select-grid">
                {strategies.filter(s => s.performance).map(strategy => (
                  <div key={strategy.id} className="strategy-select-card">
                    <label className="select-label">
                      <input
                        type="checkbox"
                        checked={selectedStrategies.includes(strategy.id)}
                        disabled={!selectedStrategies.includes(strategy.id) && selectedStrategies.length >= 4}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStrategies([...selectedStrategies, strategy.id])
                          } else {
                            setSelectedStrategies(selectedStrategies.filter(id => id !== strategy.id))
                          }
                        }}
                      />
                      <div className="select-strategy-info">
                        <h5>{strategy.name}</h5>
                        {strategy.performance && (
                          <span className={strategy.performance.totalReturn >= 0 ? 'positive-cn' : 'negative-cn'}>
                            {strategy.performance.totalReturn.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
                {strategies.filter(s => s.performance).length === 0 && (
                  <div className="no-strategies">
                    <p>还没有回测过的策略，请先运行回测！</p>
                    <button onClick={() => setActiveTab('backtest')} className="quick-btn">
                      去回测
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 对比结果 */}
            {selectedStrategies.length >= 2 && (
              <div className="compare-results">
                <h4>📊 策略对比结果</h4>
                
                {/* 对比图表 */}
                <div className="compare-chart-section">
                  <div className="chart-container">
                    <div className="chart-y-axis">
                      <span>+50%</span>
                      <span>+25%</span>
                      <span>0%</span>
                      <span>-25%</span>
                      <span>-50%</span>
                    </div>
                    <div className="chart-area">
                      <svg width="100%" height="250" viewBox="0 0 600 250">
                        <line x1="0" y1="125" x2="580" y2="125" stroke="#ddd" strokeWidth="1" />
                        <line x1="0" y1="62" x2="580" y2="62" stroke="#eee" strokeWidth="1" />
                        <line x1="0" y1="187" x2="580" y2="187" stroke="#eee" strokeWidth="1" />
                        
                        {selectedStrategies.map((strategyId, index) => {
                          const strategy = strategies.find(s => s.id === strategyId)
                          if (!strategy?.performance?.equityCurve) return null
                          
                          const colors = ['#4ECDC4', '#FF6B6B', '#FFD93D', '#9B59B6']
                          const points = strategy.performance.equityCurve
                          const initialEquity = points[0].equity
                          
                          const pathData = points.map((p, i) => {
                            const x = (i / (points.length - 1)) * 580
                            const normalizedEquity = ((p.equity - initialEquity) / initialEquity) * 100
                            const y = 125 - normalizedEquity * 2.5
                            return `${i === 0 ? 'M' : 'L'}${x},${Math.max(0, Math.min(250, y))}`
                          }).join(' ')
                          
                          return (
                            <path
                              key={strategyId}
                              d={pathData}
                              stroke={colors[index]}
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )
                        })}
                      </svg>
                      <div className="chart-x-axis">
                        <span>Day1</span>
                        <span>Day60</span>
                        <span>Day120</span>
                        <span>Day180</span>
                        <span>Day250</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 图例 */}
                  <div className="chart-legend">
                    {selectedStrategies.map((strategyId, index) => {
                      const strategy = strategies.find(s => s.id === strategyId)
                      const colors = ['#4ECDC4', '#FF6B6B', '#FFD93D', '#9B59B6']
                      return (
                        <div key={strategyId} className="legend-item">
                          <span className="legend-color" style={{backgroundColor: colors[index]}}></span>
                          <span>{strategy?.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 对比表格 */}
                <div className="compare-table">
                  <h4>📋 指标对比</h4>
                  <div className="results-table">
                    <div className="table-header">
                      <span>指标</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        return <span key={strategyId}>{strategy?.name}</span>
                      })}
                    </div>
                    <div className="table-row">
                      <span>总收益</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        const totalReturn = perf?.totalReturn || 0
                        return (
                          <span key={strategyId} className={totalReturn >= 0 ? 'positive-cn' : 'negative-cn'}>
                            {perf ? `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%` : '-'}
                          </span>
                        )
                      })}
                    </div>
                    <div className="table-row">
                      <span>年化收益</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        const annualReturn = perf?.annualReturn || 0
                        return (
                          <span key={strategyId} className={annualReturn >= 0 ? 'positive-cn' : 'negative-cn'}>
                            {perf ? `${annualReturn >= 0 ? '+' : ''}${annualReturn.toFixed(2)}%` : '-'}
                          </span>
                        )
                      })}
                    </div>
                    <div className="table-row">
                      <span>夏普比率</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        return <span key={strategyId}>{perf ? perf.sharpeRatio.toFixed(2) : '-'}</span>
                      })}
                    </div>
                    <div className="table-row">
                      <span>最大回撤</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        return <span key={strategyId} className="negative-cn">{perf ? `-${perf.maxDrawdown.toFixed(2)}%` : '-'}</span>
                      })}
                    </div>
                    <div className="table-row">
                      <span>胜率</span>
                      {selectedStrategies.map(strategyId => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        return <span key={strategyId}>{perf ? `${perf.winRate.toFixed(2)}%` : '-'}</span>
                      })}
                    </div>
                  </div>
                </div>

                {/* 雷达图 */}
                <div className="radar-section">
                  <h4>🎯 风险收益雷达图</h4>
                  <div className="radar-container">
                    <svg width="400" height="400" viewBox="0 0 400 400">
                      {/* 背景网格 */}
                      {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
                        <polygon
                          key={r}
                          points={[0, 1, 2, 3, 4, 5].map(i => {
                            const angle = (i * 60 - 90) * Math.PI / 180
                            return `${200 + r * 140 * Math.cos(angle)},${200 + r * 140 * Math.sin(angle)}`
                          }).join(' ')}
                          fill="none"
                          stroke="#ddd"
                          strokeWidth="1"
                        />
                      ))}
                      {/* 坐标轴 */}
                      {[0, 1, 2, 3, 4, 5].map(i => {
                        const angle = (i * 60 - 90) * Math.PI / 180
                        return (
                          <line
                            key={i}
                            x1="200"
                            y1="200"
                            x2={200 + 140 * Math.cos(angle)}
                            y2={200 + 140 * Math.sin(angle)}
                            stroke="#ddd"
                            strokeWidth="1"
                          />
                        )
                      })}
                      {/* 标签 */}
                      {['收益', '胜率', '夏普比', '稳定性', '盈亏比', '回撤控制'].map((label, i) => {
                        const angle = (i * 60 - 90) * Math.PI / 180
                        const distance = 160
                        return (
                          <text
                            key={i}
                            x={200 + distance * Math.cos(angle)}
                            y={200 + distance * Math.sin(angle) + 5}
                            textAnchor="middle"
                            fontSize="14"
                            fill="#666"
                          >
                            {label}
                          </text>
                        )
                      })}
                      {/* 策略区域 */}
                      {selectedStrategies.map((strategyId, index) => {
                        const strategy = strategies.find(s => s.id === strategyId)
                        const perf = strategy?.performance
                        if (!perf) return null
                        
                        const colors = ['rgba(78, 205, 196, 0.3)', 'rgba(255, 107, 107, 0.3)', 'rgba(255, 217, 61, 0.3)', 'rgba(155, 89, 182, 0.3)']
                        const strokeColors = ['#4ECDC4', '#FF6B6B', '#FFD93D', '#9B59B6']
                        
                        const values = [
                          Math.min(1, Math.max(0, perf.totalReturn / 50)),
                          Math.min(1, Math.max(0, perf.winRate / 100)),
                          Math.min(1, Math.max(0, perf.sharpeRatio / 3)),
                          Math.min(1, Math.max(0, 1 - perf.maxDrawdown / 40)),
                          Math.min(1, Math.max(0, perf.profitLossRatio / 3)),
                          Math.min(1, Math.max(0, 1 - perf.maxDrawdown / 30))
                        ]
                        
                        const points = values.map((v, i) => {
                          const angle = (i * 60 - 90) * Math.PI / 180
                          return `${200 + v * 140 * Math.cos(angle)},${200 + v * 140 * Math.sin(angle)}`
                        }).join(' ')
                        
                        return (
                          <g key={strategyId}>
                            <polygon
                              points={points}
                              fill={colors[index]}
                              stroke={strokeColors[index]}
                              strokeWidth="2"
                            />
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuantLab
