import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Position {
  id: string
  symbol: string
  name: string
  quantity: number
  avgCost: number
  currentPrice: number
  buyDate: number // 买入日期（时间戳）
  canSell: boolean // 是否可卖出
  assetType: 'stock' | 'fund' | 'bond' | 'option' | 'future' // 资产类型
  // 期权特定属性
  optionType?: 'call' | 'put' // 认购/认沽
  strikePrice?: number // 行权价
  // 期货特定属性
  margin?: number // 占用保证金
  contractSize?: number // 合约乘数
}

export interface StopLossOrder {
  id: string
  symbol: string
  name: string
  quantity: number
  stopPrice: number // 止损价格
  createTime: number
  status: 'active' | 'triggered' | 'cancelled'
}

export interface AutoInvestPlan {
  id: string
  symbol: string
  name: string
  amount: number // 每次定投金额
  interval: 'daily' | 'weekly' | 'monthly' // 定投周期
  createTime: number
  nextExecuteTime: number
  status: 'active' | 'paused' | 'cancelled'
  executedCount: number // 已执行次数
  totalInvested: number // 累计投入金额
}

export interface Transaction {
  id: string
  timestamp: number
  type: 'buy' | 'sell'
  symbol: string
  name: string
  price: number
  quantity: number
  commission: number
}

export interface EquityRecord {
  date: string
  value: number
}

export interface UserState {
  level: number
  experience: number
  gold: number
  totalAsset: number
  availableFund: number
  positions: Position[]
  stopLossOrders: StopLossOrder[]
  autoInvestPlans: AutoInvestPlan[]
  transactions: Transaction[]
  lastResetTime: number | null
  equityHistory: EquityRecord[]
  completedCourses: string[]

  addExperience: (exp: number) => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  addFund: (amount: number) => void
  withdrawFund: (amount: number) => boolean
  updatePosition: (position: Position) => void
  removePosition: (id: string) => void
  addTransaction: (transaction: Transaction) => void
  updatePrices: (prices: Record<string, number>) => void
  calculateTotalAsset: () => number
  reset: () => void
  canReset: () => boolean
  recordEquity: () => void
  completeCourse: (courseId: string) => boolean
  hasCompletedCourse: (courseId: string) => boolean
  canSellPosition: (positionId: string) => boolean
  updatePositionSellable: () => void
  addStopLossOrder: (order: Omit<StopLossOrder, 'id' | 'createTime' | 'status'>) => string
  cancelStopLossOrder: (orderId: string) => void
  checkStopLossOrders: (prices: Record<string, number>) => Array<{ order: StopLossOrder; symbol: string; price: number }>
  addAutoInvestPlan: (plan: Omit<AutoInvestPlan, 'id' | 'createTime' | 'status' | 'executedCount' | 'totalInvested' | 'nextExecuteTime'>) => string
  pauseAutoInvestPlan: (planId: string) => void
  resumeAutoInvestPlan: (planId: string) => void
  cancelAutoInvestPlan: (planId: string) => void
  checkAutoInvestPlans: (prices: Record<string, number>) => Array<{ plan: AutoInvestPlan; symbol: string; price: number }>
}

const INITIAL_STATE = {
  level: 1,
  experience: 0,
  gold: 0,
  totalAsset: 100000,
  availableFund: 100000,
  positions: [],
  stopLossOrders: [],
  autoInvestPlans: [],
  transactions: [],
  lastResetTime: null,
  equityHistory: [
    { date: new Date().toISOString().split('T')[0], value: 100000 }
  ],
  completedCourses: [],
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addExperience: (exp: number) => {
        const state = get()
        const newExp = state.experience + exp
        const expNeeded = state.level * 100

        if (newExp >= expNeeded) {
          set({
            experience: newExp - expNeeded,
            level: state.level + 1,
          })
        } else {
          set({ experience: newExp })
        }
      },

      addGold: (amount: number) => {
        set(state => ({ gold: state.gold + amount }))
      },

      spendGold: (amount: number) => {
        const state = get()
        if (state.gold >= amount) {
          set({ gold: state.gold - amount })
          return true
        }
        return false
      },

      addFund: (amount: number) => {
        set(state => ({ availableFund: state.availableFund + amount }))
      },

      withdrawFund: (amount: number) => {
        const state = get()
        if (state.availableFund >= amount) {
          set({ availableFund: state.availableFund - amount })
          return true
        }
        return false
      },

      updatePosition: (position: Position) => {
        set(state => {
          const existing = state.positions.findIndex(p => p.id === position.id)
          if (existing >= 0) {
            const updated = [...state.positions]
            updated[existing] = position
            return { positions: updated }
          }
          return { positions: [...state.positions, position] }
        })
      },

      removePosition: (id: string) => {
        set(state => ({
          positions: state.positions.filter(p => p.id !== id),
        }))
      },

      addTransaction: (transaction: Transaction) => {
        set(state => ({
          transactions: [transaction, ...state.transactions].slice(0, 100),
        }))
      },

      updatePrices: (prices: Record<string, number>) => {
        set(state => ({
          positions: state.positions.map(p => ({
            ...p,
            currentPrice: prices[p.symbol] ?? p.currentPrice,
          })),
        }))
      },

      calculateTotalAsset: () => {
        const state = get()
        const positionsValue = state.positions.reduce(
          (sum, p) => {
            const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
            return sum + p.currentPrice * p.quantity * contractMultiplier
          },
          0
        )
        return state.availableFund + positionsValue
      },

      canReset: () => {
        const state = get()
        if (!state.lastResetTime) return true
        const cooldown = 24 * 60 * 60 * 1000 // 24小时
        return Date.now() - state.lastResetTime >= cooldown
      },

      reset: () => {
    const state = get()
    if (!state.canReset()) {
      alert('重置冷却中，24小时后才能再次重置')
      return
    }
    set({
      ...INITIAL_STATE,
      level: state.level,
      experience: state.experience,
      gold: state.gold,
      lastResetTime: Date.now(),
    })
  },

  recordEquity: () => {
    const state = get()
    const today = new Date().toISOString().split('T')[0]
    const currentValue = state.calculateTotalAsset()
    
    const existingIndex = state.equityHistory.findIndex(e => e.date === today)
    if (existingIndex >= 0) {
      const newHistory = [...state.equityHistory]
      newHistory[existingIndex] = { date: today, value: currentValue }
      set({ equityHistory: newHistory })
    } else {
      set({ equityHistory: [...state.equityHistory, { date: today, value: currentValue }] })
    }
  },

  completeCourse: (courseId: string) => {
    const state = get()
    if (state.completedCourses.includes(courseId)) {
      return false
    }
    set(state => ({
      completedCourses: [...state.completedCourses, courseId]
    }))
    return true
  },

  hasCompletedCourse: (courseId: string) => {
    const state = get()
    return state.completedCourses.includes(courseId)
  },
  
  canSellPosition: (positionId: string) => {
    const state = get()
    const position = state.positions.find(p => p.id === positionId)
    if (!position) return false
    
    // 简化的T+1规则：买入后立即可以卖出（为了游戏体验）
    // 如果想要真实的T+1，可以改为：
    // const now = Date.now()
    // const oneDay = 24 * 60 * 60 * 1000
    // return now - position.buyDate >= oneDay
    return true
  },
  
  updatePositionSellable: () => {
    const state = get()
    set({
      positions: state.positions.map(p => ({
        ...p,
        canSell: true // 简化的T+1规则：所有仓位都可立即卖出
      })),
    })
  },

  addStopLossOrder: (order) => {
    const state = get()
    const newOrder: StopLossOrder = {
      ...order,
      id: `stoploss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createTime: Date.now(),
      status: 'active',
    }
    set({ stopLossOrders: [...state.stopLossOrders, newOrder] })
    return newOrder.id
  },

  cancelStopLossOrder: (orderId) => {
    const state = get()
    set({
      stopLossOrders: state.stopLossOrders.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ),
    })
  },

  checkStopLossOrders: (prices) => {
    const state = get()
    const triggeredOrders: Array<{ order: StopLossOrder; symbol: string; price: number }> = []

    state.stopLossOrders.forEach(order => {
      if (order.status !== 'active') return
      const currentPrice = prices[order.symbol]
      if (currentPrice === undefined) return

      if (currentPrice <= order.stopPrice) {
        triggeredOrders.push({ order, symbol: order.symbol, price: currentPrice })
      }
    })

    if (triggeredOrders.length > 0) {
      set({
        stopLossOrders: state.stopLossOrders.map(o => 
          triggeredOrders.some(t => t.order.id === o.id) 
            ? { ...o, status: 'triggered' } 
            : o
        ),
      })
    }

    return triggeredOrders
  },

  addAutoInvestPlan: (plan) => {
    const state = get()
    const now = Date.now()
    
    // 计算下次执行时间（游戏加速版）
    let nextExecuteTime = now
    if (plan.interval === 'daily') {
      nextExecuteTime = now + 30000 // 30秒
    } else if (plan.interval === 'weekly') {
      nextExecuteTime = now + 60000 // 60秒
    } else if (plan.interval === 'monthly') {
      nextExecuteTime = now + 120000 // 120秒
    }

    const newPlan: AutoInvestPlan = {
      ...plan,
      id: `autoinvest_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createTime: now,
      nextExecuteTime,
      status: 'active',
      executedCount: 0,
      totalInvested: 0,
    }
    set({ autoInvestPlans: [...state.autoInvestPlans, newPlan] })
    return newPlan.id
  },

  pauseAutoInvestPlan: (planId) => {
    const state = get()
    set({
      autoInvestPlans: state.autoInvestPlans.map(p => 
        p.id === planId ? { ...p, status: 'paused' } : p
      ),
    })
  },

  resumeAutoInvestPlan: (planId) => {
    const state = get()
    const now = Date.now()
    set({
      autoInvestPlans: state.autoInvestPlans.map(p => {
        if (p.id === planId) {
          // 重新计算下次执行时间
          let nextExecuteTime = now
          if (p.interval === 'daily') {
            nextExecuteTime = now + 30000
          } else if (p.interval === 'weekly') {
            nextExecuteTime = now + 60000
          } else if (p.interval === 'monthly') {
            nextExecuteTime = now + 120000
          }
          return { ...p, status: 'active', nextExecuteTime }
        }
        return p
      }),
    })
  },

  cancelAutoInvestPlan: (planId) => {
    const state = get()
    set({
      autoInvestPlans: state.autoInvestPlans.map(p => 
        p.id === planId ? { ...p, status: 'cancelled' } : p
      ),
    })
  },

  checkAutoInvestPlans: (prices) => {
    const state = get()
    const now = Date.now()
    const executedPlans: Array<{ plan: AutoInvestPlan; symbol: string; price: number }> = []

    state.autoInvestPlans.forEach(plan => {
      if (plan.status !== 'active') return
      if (now < plan.nextExecuteTime) return
      
      const currentPrice = prices[plan.symbol]
      if (currentPrice === undefined) return

      executedPlans.push({ plan, symbol: plan.symbol, price: currentPrice })
    })

    if (executedPlans.length > 0) {
      set({
        autoInvestPlans: state.autoInvestPlans.map(p => {
          const executed = executedPlans.find(e => e.plan.id === p.id)
          if (!executed) return p

          // 计算下次执行时间
          let nextExecuteTime = now
          if (p.interval === 'daily') {
            nextExecuteTime = now + 30000
          } else if (p.interval === 'weekly') {
            nextExecuteTime = now + 60000
          } else if (p.interval === 'monthly') {
            nextExecuteTime = now + 120000
          }

          return {
            ...p,
            nextExecuteTime,
            executedCount: p.executedCount + 1,
            totalInvested: p.totalInvested + p.amount,
          }
        }),
      })
    }

    return executedPlans
  },
}),
    {
      name: 'investquest-user',
    }
  )
)
