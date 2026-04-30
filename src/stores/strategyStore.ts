import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BacktestParams {
  initialCapital: number
  commissionRate: number
  slippageRate: number
}

export interface Strategy {
  id: string
  name: string
  description: string
  code: string
  isTemplate: boolean
  isActive: boolean
  lastRun: Date | null
  backtestParams: BacktestParams
  performance: {
    totalReturn: number
    annualReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitLossRatio: number
    tradeCount: number
    avgHoldDays: number
    equityCurve: { time: number; equity: number }[]
    drawdownCurve: { time: number; drawdown: number }[]
    tradePoints: { time: number; price: number; type: 'buy' | 'sell' }[]
  } | null
}

const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  initialCapital: 100000,
  commissionRate: 0.03,
  slippageRate: 0.01
}

const TEMPLATE_STRATEGIES: Strategy[] = [
  {
    id: 'template-ma-cross',
    name: '均线交叉策略',
    description: 'MA5上穿MA10买入，下穿MA10卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 均线交叉策略
// MA5上穿MA10买入，下穿MA10卖出

if (MA5 > MA10 && !持有) {
  买入() 
}

if (MA5 < MA10 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-rsi',
    name: 'RSI超买超卖策略',
    description: 'RSI<30买入，RSI>70卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// RSI超买超卖策略
// RSI<30买入，RSI>70卖出

if (RSI < 30 && !持有) {
  买入() 
}

if (RSI > 70 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-macd',
    name: 'MACD金叉策略',
    description: 'MACD金叉买入，死叉卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// MACD金叉策略
// MACD金叉买入，死叉卖出

if (MACD金叉 && !持有) {
  买入() 
}

if (MACD死叉 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-kdj',
    name: 'KDJ策略',
    description: 'K线上穿D线买入，下穿D线卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// KDJ策略
// K线上穿D线买入，下穿D线卖出

if (K > D && !持有) {
  买入() 
}

if (K < D && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-bollinger',
    name: '布林带策略',
    description: '价格触及下轨买入，上轨卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 布林带策略
// 价格触及下轨买入，上轨卖出

if (价格 <= 布林下轨 && !持有) {
  买入() 
}

if (价格 >= 布林上轨 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-sector-rotation',
    name: '板块轮动策略',
    description: '计算行业RSI，买入RSI低且回升的板块',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 板块轮动策略
// 计算各行业RSI，买入RSI低且开始回升的板块

if (行业RSI < 35 && RSI > 昨日RSI && !持有) {
  买入() 
}

if (行业RSI > 65 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-momentum',
    name: '动量策略',
    description: '买入近期强势资产，卖出弱势资产',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 动量策略
// 选择过去N天涨幅最大的股票，持有M天

if (过去20天涨幅 > 10% && !持有) {
  买入() 
}

if (持有超过20天) {
  卖出() 
}
`
  },
  {
    id: 'template-value-investing',
    name: '价值投资策略',
    description: '筛选低PE、低PB、高ROE的股票',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 价值投资策略
// 筛选低PE、低PB、高ROE的股票

if (PE < 15 && PB < 2 && ROE > 12% && !持有) {
  买入() 
}

if (PE > 30 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-mean-reversion',
    name: '均值回归策略',
    description: '价格偏离均值后回归买入/卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 均值回归策略
// 当价格偏离移动平均线一定幅度时反向操作

if (价格 < MA20 * 0.95 && !持有) {
  买入() 
}

if (价格 > MA20 * 1.05 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-trend-following',
    name: '趋势跟踪策略',
    description: '长短期均线金叉买入，死叉卖出',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 趋势跟踪策略
// 长短期均线金叉买入，死叉卖出

if (MA20 > MA60 && !持有) {
  买入() 
}

if (MA20 < MA60 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-volatility-breakout',
    name: '波动性突破策略',
    description: '突破近期波动区间后入场',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 波动性突破策略
// 价格突破近期波动区间时入场

if (价格 > 过去20天最高价 && !持有) {
  买入() 
}

if (价格 < 过去20天最低价 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-seasonal',
    name: '季节性策略',
    description: '基于历史季节性规律进行交易',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 季节性策略
// 基于历史季节性表现进行交易

if (月份 == 11 && !持有) {
  买入() 
}

if (月份 == 5 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-volume-anomaly',
    name: '成交量异常策略',
    description: '成交量突然放大超过均值3倍时交易',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 成交量异常策略
// 成交量突然放大超过均值3倍时交易

if (成交量 > 昨日成交量 * 3 && !持有) {
  买入() 
}

if (成交量 < 昨日成交量 * 0.5 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-multi-factor',
    name: '多因子选股策略',
    description: '综合动量、价值、质量等因子选股',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 多因子选股策略
// 综合动量、价值、质量等因子选股

const 动量得分 = 过去30天涨幅
const 价值得分 = 1/PE
const 质量得分 = ROE

const 综合得分 = 动量得分*0.4 + 价值得分*0.3 + 质量得分*0.3

if (综合得分 > 阈值 && !持有) {
  买入() 
}

if (综合得分 < 阈值*0.7 && 持有) {
  卖出() 
}
`
  },
  {
    id: 'template-pairs-trading',
    name: '配对交易策略',
    description: '寻找相关性高的资产对，价差扩大时交易',
    isTemplate: true,
    isActive: false,
    lastRun: null,
    backtestParams: DEFAULT_BACKTEST_PARAMS,
    performance: null,
    code: `// 配对交易策略
// 寻找相关性高的资产对，当价差扩大时交易

const 价差 = 资产A价格 - 资产B价格
const 均值 = 过去30天价差平均
const 标准差 = 过去30天价差标准差

if (价差 > 均值 + 2*标准差 && !持有) {
  买B卖A() 
}

if (价差 < 均值 - 2*标准差 && !持有) {
  买A卖B() 
}
`
  }
]

interface StrategyStore {
  strategies: Strategy[]
  activeStrategyId: string | null
  currentStrategyCode: string
  globalBacktestParams: BacktestParams
  
  setCurrentStrategyCode: (code: string) => void
  saveStrategy: (strategy: Omit<Strategy, 'id' | 'lastRun' | 'performance'>) => void
  deleteStrategy: (id: string) => void
  activateStrategy: (id: string) => void
  deactivateStrategy: () => void
  runBacktest: (id: string) => Promise<Strategy>
  duplicateTemplate: (id: string) => void
  updateStrategyBacktestParams: (id: string, params: Partial<BacktestParams>) => void
  updateGlobalBacktestParams: (params: Partial<BacktestParams>) => void
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set, get) => ({
      strategies: TEMPLATE_STRATEGIES,
      activeStrategyId: null,
      currentStrategyCode: '',
      globalBacktestParams: DEFAULT_BACKTEST_PARAMS,

      setCurrentStrategyCode: (code) => {
        set({ currentStrategyCode: code })
      },

      saveStrategy: (strategy) => {
        const newStrategy: Strategy = {
          ...strategy,
          id: `strategy-${Date.now()}`,
          lastRun: null,
          performance: null,
          backtestParams: strategy.backtestParams || get().globalBacktestParams
        }
        set(state => ({
          strategies: [...state.strategies, newStrategy]
        }))
      },

      deleteStrategy: (id) => {
        set(state => ({
          strategies: state.strategies.filter(s => s.id !== id),
          activeStrategyId: state.activeStrategyId === id ? null : state.activeStrategyId
        }))
      },

      activateStrategy: (id) => {
        set({ activeStrategyId: id })
        set(state => ({
          strategies: state.strategies.map(s => 
            s.id === id ? { ...s, isActive: true } : { ...s, isActive: false }
          )
        }))
      },

      deactivateStrategy: () => {
        set({ activeStrategyId: null })
        set(state => ({
          strategies: state.strategies.map(s => ({ ...s, isActive: false }))
        }))
      },

      runBacktest: async (id) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const strategy = get().strategies.find(s => s.id === id)!
            const params = strategy.backtestParams
            
            // 生成模拟回测数据
            const days = 250
            const initialEquity = params.initialCapital
            let currentEquity = initialEquity
            let peakEquity = initialEquity
            let tradeCount = Math.floor(Math.random() * 60) + 20
            let winningTrades = 0
            let avgProfit = 0
            let avgLoss = 0
            
            const equityCurve: { time: number; equity: number }[] = []
            const drawdownCurve: { time: number; drawdown: number }[] = []
            const tradePoints: { time: number; price: number; type: 'buy' | 'sell' }[] = []
            
            for (let i = 0; i < days; i++) {
              // 模拟资金变化
              const dailyReturn = (Math.random() - 0.48) * 0.03
              currentEquity = currentEquity * (1 + dailyReturn)
              
              // 记录峰值
              if (currentEquity > peakEquity) {
                peakEquity = currentEquity
              }
              
              // 计算回撤
              const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100
              
              equityCurve.push({ time: i, equity: currentEquity })
              drawdownCurve.push({ time: i, drawdown: drawdown })
              
              // 随机生成交易点
              if (Math.random() < 0.1 && tradePoints.length < tradeCount) {
                const isBuy = tradePoints.length % 2 === 0
                const price = Math.random() * 100 + 50
                
                if (!isBuy) {
                  const tradeReturn = Math.random() - 0.45
                  if (tradeReturn > 0) {
                    winningTrades++
                    avgProfit += tradeReturn
                  } else {
                    avgLoss += tradeReturn
                  }
                }
                
                tradePoints.push({ time: i, price, type: isBuy ? 'buy' : 'sell' })
              }
            }
            
            const totalReturn = ((currentEquity - initialEquity) / initialEquity) * 100
            const annualReturn = totalReturn / (days / 252)
            const maxDrawdown = Math.max(...drawdownCurve.map(d => d.drawdown))
            const winRate = tradePoints.length > 0 ? (winningTrades / (tradePoints.length / 2)) * 100 : 0
            const profitLossRatio = avgLoss === 0 ? 2 : Math.abs(avgProfit / avgLoss)
            const avgHoldDays = tradeCount > 0 ? days / (tradeCount / 2) : 10
            
            // 计算夏普比率（简化版）
            const dailyReturns = equityCurve.slice(1).map((e, i) => 
              (e.equity - equityCurve[i].equity) / equityCurve[i].equity
            )
            const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
            const stdDev = Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length)
            const sharpeRatio = stdDev > 0 ? (avgDailyReturn * Math.sqrt(252)) / stdDev : 0
            
            const newPerformance = {
              totalReturn,
              annualReturn,
              sharpeRatio,
              maxDrawdown,
              winRate,
              profitLossRatio,
              tradeCount: tradePoints.length,
              avgHoldDays,
              equityCurve,
              drawdownCurve,
              tradePoints
            }
            
            const updatedStrategy = {
              ...strategy,
              lastRun: new Date(),
              performance: newPerformance
            }

            set(state => ({
              strategies: state.strategies.map(s => 
                s.id === id ? updatedStrategy : s
              )
            }))

            resolve(updatedStrategy)
          }, 2000)
        })
      },

      duplicateTemplate: (id) => {
        const template = get().strategies.find(s => s.id === id)
        if (template) {
          const newStrategy: Strategy = {
            ...template,
            id: `strategy-${Date.now()}`,
            name: `${template.name} (副本)`,
            isTemplate: false,
            isActive: false,
            lastRun: null,
            performance: null,
          }
          set(state => ({
            strategies: [...state.strategies, newStrategy]
          }))
        }
      },

      updateStrategyBacktestParams: (id, params) => {
        set(state => ({
          strategies: state.strategies.map(s => 
            s.id === id ? { ...s, backtestParams: { ...s.backtestParams, ...params } } : s
          )
        }))
      },

      updateGlobalBacktestParams: (params) => {
        set(state => ({
          globalBacktestParams: { ...state.globalBacktestParams, ...params }
        }))
      }
    }),
    {
      name: 'investquest-strategies',
    }
  )
)
