import { create } from 'zustand'

export interface Asset {
  symbol: string
  name: string
  type: 'stock' | 'fund' | 'bond' | 'option' | 'future'
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  volume: number
  volatility: number
  drift: number
  board: 'main' | 'gem' | 'star' // 主板 / 创业板 / 科创板
  previousClose: number // 昨收价
  // 期权特定属性
  optionType?: 'call' | 'put' // 认购/认沽
  strikePrice?: number // 行权价
  expiryDate?: number // 到期日时间戳
  underlyingSymbol?: string // 标的代码
  // 期货特定属性
  contractSize?: number // 合约乘数
  marginRatio?: number // 保证金比例
  deliveryMonth?: string // 交割月份
}

export interface KBar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketIndex {
  id: string
  name: string
  value: number
  history: { time: number, value: number }[]
  change: number
  changePercent: number
}

export interface NewsItem {
  id: string
  title: string
  content: string
  impact: 'positive' | 'negative' | 'neutral'
  targetSymbols: string[]
  impactStrength: number // 0-1, 影响强度
  timestamp: number
  read: boolean
}

interface MarketState {
  assets: Asset[]
  kbarData: Record<string, KBar[]>
  lastUpdate: number
  marketIndex: MarketIndex
  news: NewsItem[]

  generateInitialAssets: () => void
  updatePrices: () => void
  generateKbar: (symbol: string, count?: number) => KBar[]
  getAsset: (symbol: string) => Asset | undefined
  generateNews: () => void
  applyNewsImpact: (newsId: string) => void
  markNewsRead: (newsId: string) => void
}

interface AssetConfig {
  symbol: string
  name: string
  type: 'stock' | 'fund' | 'bond' | 'option' | 'future'
  basePrice: number
  volatility: number
  drift: number
  board: 'main' | 'gem' | 'star'
  // 期权特定属性
  optionType?: 'call' | 'put'
  strikePrice?: number
  underlyingSymbol?: string
  // 期货特定属性
  contractSize?: number
  marginRatio?: number
  deliveryMonth?: string
}

const ASSET_CONFIG: AssetConfig[] = [
  // 股票 - 蓝筹股（主板）
  { symbol: 'SH600100', name: '华能能源', type: 'stock' as const, basePrice: 12.5, volatility: 0.025, drift: 0.05, board: 'main' },
  { symbol: 'SH600101', name: '宇宙银行', type: 'stock' as const, basePrice: 8.8, volatility: 0.018, drift: 0.03, board: 'main' },
  { symbol: 'SH600102', name: '东方建筑', type: 'stock' as const, basePrice: 6.2, volatility: 0.022, drift: 0.04, board: 'main' },
  { symbol: 'SH600103', name: '中国石油化工', type: 'stock' as const, basePrice: 5.6, volatility: 0.028, drift: 0.045, board: 'main' },
  { symbol: 'SH600104', name: '平安保险', type: 'stock' as const, basePrice: 38.5, volatility: 0.030, drift: 0.06, board: 'main' },
  
  // 股票 - 科技股（主板/科创板）
  { symbol: 'SH600200', name: '科技创新', type: 'stock' as const, basePrice: 45.5, volatility: 0.035, drift: 0.08, board: 'star' },
  { symbol: 'SH600201', name: '云网络', type: 'stock' as const, basePrice: 88.8, volatility: 0.040, drift: 0.09, board: 'star' },
  { symbol: 'SH600202', name: '软件发展', type: 'stock' as const, basePrice: 32.3, volatility: 0.032, drift: 0.075, board: 'gem' },
  { symbol: 'SH600203', name: '电子科技', type: 'stock' as const, basePrice: 52.6, volatility: 0.038, drift: 0.085, board: 'gem' },
  
  // 股票 - 新能源（创业板/科创板）
  { symbol: 'SH600300', name: '新能源车', type: 'stock' as const, basePrice: 288.8, volatility: 0.045, drift: 0.10, board: 'star' },
  { symbol: 'SH600301', name: '阳光能源', type: 'stock' as const, basePrice: 78.2, volatility: 0.042, drift: 0.095, board: 'gem' },
  { symbol: 'SH600302', name: '风能发电', type: 'stock' as const, basePrice: 42.5, volatility: 0.038, drift: 0.085, board: 'gem' },
  { symbol: 'SH600303', name: '动力电池', type: 'stock' as const, basePrice: 328.5, volatility: 0.048, drift: 0.11, board: 'star' },
  
  // 股票 - 医疗健康（主板/科创板）
  { symbol: 'SH600400', name: '恒康医药', type: 'stock' as const, basePrice: 58.3, volatility: 0.030, drift: 0.07, board: 'main' },
  { symbol: 'SH600401', name: '新新医疗', type: 'stock' as const, basePrice: 125.6, volatility: 0.035, drift: 0.08, board: 'star' },
  { symbol: 'SH600402', name: '生物基因', type: 'stock' as const, basePrice: 258.2, volatility: 0.042, drift: 0.095, board: 'star' },
  { symbol: 'SH600403', name: '医疗器械', type: 'stock' as const, basePrice: 68.5, volatility: 0.028, drift: 0.065, board: 'main' },
  
  // 股票 - 消费（主板）
  { symbol: 'SH600500', name: '茅台白酒', type: 'stock' as const, basePrice: 1888.5, volatility: 0.022, drift: 0.055, board: 'main' },
  { symbol: 'SH600501', name: '海天酱油', type: 'stock' as const, basePrice: 72.6, volatility: 0.020, drift: 0.05, board: 'main' },
  { symbol: 'SH600502', name: '美的电器', type: 'stock' as const, basePrice: 58.8, volatility: 0.025, drift: 0.055, board: 'main' },
  { symbol: 'SH600503', name: '伊利乳业', type: 'stock' as const, basePrice: 38.5, volatility: 0.018, drift: 0.045, board: 'main' },
  
  // 股票 - 其他板块（创业板/科创板）
  { symbol: 'SH600600', name: '半导体芯片', type: 'stock' as const, basePrice: 128.5, volatility: 0.045, drift: 0.10, board: 'star' },
  { symbol: 'SH600601', name: '人工智能', type: 'stock' as const, basePrice: 258.8, volatility: 0.048, drift: 0.105, board: 'star' },
  { symbol: 'SH600602', name: '元宇宙科技', type: 'stock' as const, basePrice: 88.6, volatility: 0.042, drift: 0.095, board: 'gem' },
  
  // 基金 - 指数基金
  { symbol: 'SZ159901', name: '上证指数ETF', type: 'fund' as const, basePrice: 3.85, volatility: 0.015, drift: 0.035, board: 'main' },
  { symbol: 'SZ159902', name: '沪深300ETF', type: 'fund' as const, basePrice: 4.20, volatility: 0.018, drift: 0.04, board: 'main' },
  { symbol: 'SZ159903', name: '中证500ETF', type: 'fund' as const, basePrice: 6.55, volatility: 0.020, drift: 0.045, board: 'main' },
  { symbol: 'SZ159904', name: '创业板ETF', type: 'fund' as const, basePrice: 2.85, volatility: 0.025, drift: 0.055, board: 'gem' },
  
  // 基金 - 行业基金
  { symbol: 'SZ159910', name: '科技行业ETF', type: 'fund' as const, basePrice: 5.65, volatility: 0.028, drift: 0.06, board: 'gem' },
  { symbol: 'SZ159911', name: '医药行业ETF', type: 'fund' as const, basePrice: 4.85, volatility: 0.022, drift: 0.05, board: 'main' },
  { symbol: 'SZ159912', name: '消费行业ETF', type: 'fund' as const, basePrice: 3.95, volatility: 0.018, drift: 0.04, board: 'main' },
  { symbol: 'SZ159913', name: '新能源ETF', type: 'fund' as const, basePrice: 2.65, volatility: 0.030, drift: 0.065, board: 'gem' },
  
  // 基金 - 其他
  { symbol: 'SZ159920', name: '债券ETF', type: 'fund' as const, basePrice: 108.5, volatility: 0.005, drift: 0.02, board: 'main' },
  { symbol: 'SZ159921', name: '货币ETF', type: 'fund' as const, basePrice: 100.0, volatility: 0.001, drift: 0.015, board: 'main' },
  { symbol: 'SZ159922', name: '黄金ETF', type: 'fund' as const, basePrice: 428.5, volatility: 0.012, drift: 0.03, board: 'main' },
  { symbol: 'SZ159923', name: '海外市场ETF', type: 'fund' as const, basePrice: 1.85, volatility: 0.018, drift: 0.04, board: 'main' },
  
  // 期权 - 认购期权（基于股票的期权）
  { 
    symbol: 'OP-SH600100-C-13', 
    name: '华能能源认购期权', 
    type: 'option' as const, 
    basePrice: 1.25, 
    volatility: 0.08, 
    drift: 0.02, 
    board: 'main',
    optionType: 'call',
    strikePrice: 13.0,
    underlyingSymbol: 'SH600100'
  },
  { 
    symbol: 'OP-SH600100-P-12', 
    name: '华能能源认沽期权', 
    type: 'option' as const, 
    basePrice: 0.85, 
    volatility: 0.075, 
    drift: 0.015, 
    board: 'main',
    optionType: 'put',
    strikePrice: 12.0,
    underlyingSymbol: 'SH600100'
  },
  { 
    symbol: 'OP-SH600200-C-50', 
    name: '科技创新认购期权', 
    type: 'option' as const, 
    basePrice: 4.5, 
    volatility: 0.09, 
    drift: 0.025, 
    board: 'star',
    optionType: 'call',
    strikePrice: 50.0,
    underlyingSymbol: 'SH600200'
  },
  { 
    symbol: 'OP-SH600200-P-40', 
    name: '科技创新认沽期权', 
    type: 'option' as const, 
    basePrice: 3.8, 
    volatility: 0.085, 
    drift: 0.02, 
    board: 'star',
    optionType: 'put',
    strikePrice: 40.0,
    underlyingSymbol: 'SH600200'
  },
  
  // 期货 - 商品期货
  { 
    symbol: 'FU-CU', 
    name: '铜期货', 
    type: 'future' as const, 
    basePrice: 68500, 
    volatility: 0.025, 
    drift: 0.035, 
    board: 'main',
    contractSize: 5,
    marginRatio: 0.12,
    deliveryMonth: '2025-06'
  },
  { 
    symbol: 'FU-RU', 
    name: '天然橡胶期货', 
    type: 'future' as const, 
    basePrice: 12800, 
    volatility: 0.03, 
    drift: 0.04, 
    board: 'main',
    contractSize: 10,
    marginRatio: 0.10,
    deliveryMonth: '2025-07'
  },
  { 
    symbol: 'FU-GOLD', 
    name: '黄金期货', 
    type: 'future' as const, 
    basePrice: 488, 
    volatility: 0.015, 
    drift: 0.025, 
    board: 'main',
    contractSize: 1000,
    marginRatio: 0.08,
    deliveryMonth: '2025-08'
  },
  { 
    symbol: 'FU-INDEX', 
    name: '探索500股指期货', 
    type: 'future' as const, 
    basePrice: 3200, 
    volatility: 0.02, 
    drift: 0.03, 
    board: 'main',
    contractSize: 300,
    marginRatio: 0.15,
    deliveryMonth: '2025-09'
  },
]

function generateRandomWalk(price: number, volatility: number, drift: number, board: 'main' | 'gem' | 'star', previousClose: number): number {
  const dt = 1 / 252
  const randomShock = Math.random() - 0.5
  const priceChange = price * (drift * dt + volatility * Math.sqrt(dt) * randomShock)
  
  let newPrice = Math.max(0.01, price + priceChange)
  
  // 涨跌停限制
  const limitRate = board === 'main' ? 0.10 : 0.20
  const upperLimit = previousClose * (1 + limitRate)
  const lowerLimit = previousClose * (1 - limitRate)
  
  return Math.max(lowerLimit, Math.min(upperLimit, newPrice))
}

function calculateChange(current: number, previous: number): { change: number; changePercent: number } {
  const change = current - previous
  const changePercent = (change / previous) * 100
  return { change, changePercent }
}

const NEWS_TEMPLATES = [
  {
    templates: [
      { title: '政策利好！{} 获得国家重点扶持', impact: 'positive', strength: 0.15 },
      { title: '{} 宣布重大合作协议', impact: 'positive', strength: 0.12 },
      { title: '业绩超预期！{} 季度利润大增', impact: 'positive', strength: 0.18 },
    ],
    categories: ['科技', '新能源', '医疗']
  },
  {
    templates: [
      { title: '{} 遭遇监管调查', impact: 'negative', strength: 0.15 },
      { title: '利空消息！{} 主要客户流失', impact: 'negative', strength: 0.12 },
      { title: '{} 季度业绩不及预期', impact: 'negative', strength: 0.18 },
    ],
    categories: ['蓝筹', '消费']
  }
]

export const useMarketStore = create<MarketState>((set, get) => ({
  assets: [],
  kbarData: {},
  lastUpdate: Date.now(),
  marketIndex: {
    id: 'IQ500',
    name: '探索500指数',
    value: 1000,
    history: [],
    change: 0,
    changePercent: 0,
  },
  news: [],

  generateInitialAssets: () => {
    const assets: Asset[] = ASSET_CONFIG.map(config => {
      const price = config.basePrice * (0.95 + Math.random() * 0.1)
      return {
        symbol: config.symbol,
        name: config.name,
        type: config.type,
        price,
        change: 0,
        changePercent: 0,
        high: price * 1.05,
        low: price * 0.95,
        open: price,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        volatility: config.volatility,
        drift: config.drift,
        board: config.board,
        previousClose: price,
        // 期权特定属性
        optionType: 'optionType' in config ? config.optionType : undefined,
        strikePrice: 'strikePrice' in config ? config.strikePrice : undefined,
        underlyingSymbol: 'underlyingSymbol' in config ? config.underlyingSymbol : undefined,
        expiryDate: 'optionType' in config ? Date.now() + 86400000 * 90 : undefined, // 90天后到期
        // 期货特定属性
        contractSize: 'contractSize' in config ? config.contractSize : undefined,
        marginRatio: 'marginRatio' in config ? config.marginRatio : undefined,
        deliveryMonth: 'deliveryMonth' in config ? config.deliveryMonth : undefined,
      }
    })

    const indexHistory: { time: number, value: number }[] = []
    let indexValue = 1000
    for (let i = 30; i > 0; i--) {
      indexHistory.push({
        time: Date.now() - i * 60000,
        value: indexValue,
      })
      indexValue = indexValue * (1 + (Math.random() - 0.5) * 0.02)
    }

    set({ 
      assets, 
      lastUpdate: Date.now(),
      marketIndex: {
        id: 'IQ500',
        name: '探索500指数',
        value: indexValue,
        history: indexHistory,
        change: 0,
        changePercent: 0,
      },
    })

    assets.forEach(asset => {
      get().generateKbar(asset.symbol, 100)
    })
  },

  updatePrices: () => {
    set(state => {
      const updatedAssets = state.assets.map(asset => {
        const newPrice = generateRandomWalk(asset.price, asset.volatility, asset.drift, asset.board, asset.previousClose)
        const { change, changePercent } = calculateChange(newPrice, asset.previousClose)

        return {
          ...asset,
          price: newPrice,
          change,
          changePercent,
          high: Math.max(asset.high, newPrice),
          low: Math.min(asset.low, newPrice),
          volume: asset.volume + Math.floor(Math.random() * 50000),
        }
      })

      const prevIndex = state.marketIndex
      const newIndexValue = prevIndex.value * (1 + (Math.random() - 0.5) * 0.015)
      const indexChange = newIndexValue - prevIndex.history[prevIndex.history.length - 1]?.value || newIndexValue
      const indexChangePercent = (indexChange / (prevIndex.history[prevIndex.history.length - 1]?.value || newIndexValue)) * 100

      return { 
        assets: updatedAssets, 
        lastUpdate: Date.now(),
        marketIndex: {
          ...prevIndex,
          value: newIndexValue,
          change: indexChange,
          changePercent: indexChangePercent,
          history: [...prevIndex.history, { time: Date.now(), value: newIndexValue }].slice(-50),
        },
      }
    })
  },

  generateKbar: (symbol: string, count: number = 100) => {
    const asset = get().assets.find(a => a.symbol === symbol)
    if (!asset) return []

    const kbars: KBar[] = []
    let price = asset.price * (0.85 + Math.random() * 0.1)
    let previousClose = price

    for (let i = count; i > 0; i--) {
      const open = price
      const close = generateRandomWalk(price, asset.volatility, asset.drift, asset.board, previousClose)
      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)

      kbars.push({
        time: Date.now() - i * 60000,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 5000000) + 500000,
      })

      price = close
      previousClose = close
    }

    set(state => ({
      kbarData: { ...state.kbarData, [symbol]: kbars },
    }))

    return kbars
  },

  getAsset: (symbol: string) => {
    return get().assets.find(a => a.symbol === symbol)
  },

  generateNews: () => {
    const state = get()
    if (state.news.length >= 10) return

    const randomAsset = state.assets[Math.floor(Math.random() * state.assets.length)]
    if (!randomAsset) return

    const categoryGroup = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)]
    const template = categoryGroup.templates[Math.floor(Math.random() * categoryGroup.templates.length)]

    const targetSymbols: string[] = [randomAsset.symbol]
    const relatedCount = Math.floor(Math.random() * 3)
    for (let i = 0; i < relatedCount; i++) {
      const otherAsset = state.assets[Math.floor(Math.random() * state.assets.length)]
      if (otherAsset && otherAsset.symbol !== randomAsset.symbol && !targetSymbols.includes(otherAsset.symbol)) {
        targetSymbols.push(otherAsset.symbol)
      }
    }

    const newsItem: NewsItem = {
      id: Date.now().toString(),
      title: template.title.replace('{}', randomAsset.name),
      content: `最新消息：${randomAsset.name} 出现重大变化。市场分析人士表示，这可能对相关板块产生${template.impact === 'positive' ? '积极' : template.impact === 'negative' ? '负面' : '中性'}影响。建议投资者密切关注后续发展。`,
      impact: template.impact as 'positive' | 'negative' | 'neutral',
      targetSymbols,
      impactStrength: template.strength,
      timestamp: Date.now(),
      read: false,
    }

    set(state => ({
      news: [newsItem, ...state.news].slice(0, 15),
    }))
  },

  applyNewsImpact: (newsId: string) => {
    const state = get()
    const newsItem = state.news.find(n => n.id === newsId)
    if (!newsItem || newsItem.read) return

    set(state => {
      const updatedAssets = state.assets.map(asset => {
        if (!newsItem.targetSymbols.includes(asset.symbol)) return asset

        let impactMultiplier = 0
        if (newsItem.impact === 'positive') {
          impactMultiplier = 1 + newsItem.impactStrength * (0.5 + Math.random() * 0.5)
        } else if (newsItem.impact === 'negative') {
          impactMultiplier = 1 - newsItem.impactStrength * (0.5 + Math.random() * 0.5)
        }

        if (impactMultiplier === 0) return asset

        const newPrice = asset.price * impactMultiplier
        const { change, changePercent } = calculateChange(newPrice, asset.open)

        return {
          ...asset,
          price: newPrice,
          change,
          changePercent,
        }
      })

      return {
        assets: updatedAssets,
      }
    })
  },

  markNewsRead: (newsId: string) => {
    set(state => ({
      news: state.news.map(n => n.id === newsId ? { ...n, read: true } : n),
    }))
  },
}))
