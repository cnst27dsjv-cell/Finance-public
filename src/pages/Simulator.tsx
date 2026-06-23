import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import { useMarketStore, NewsItem } from '@/stores/marketStore'
import KLineChart from '@/components/KLineChart'
import './Simulator.css'

function Simulator() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState(100)
  const [showConfirm, setShowConfirm] = useState(false)
  const [priceType, setPriceType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState(0)
  const [selectedTab, setSelectedTab] = useState<'all' | 'stock' | 'fund' | 'option' | 'future'>('all')
  const [activePanel, setActivePanel] = useState<'market' | 'portfolio' | 'news'>('market')
  const [showStopLossModal, setShowStopLossModal] = useState(false)
  const [stopLossPrice, setStopLossPrice] = useState(0)
  const [stopLossPositionId, setStopLossPositionId] = useState<string | null>(null)
  const [showAutoInvestModal, setShowAutoInvestModal] = useState(false)
  const [autoInvestAsset, setAutoInvestAsset] = useState<any>(null)
  const [autoInvestAmount, setAutoInvestAmount] = useState(1)
  const [autoInvestInterval, setAutoInvestInterval] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [currentTime, setCurrentTime] = useState(Date.now())

  const {
    availableFund,
    positions,
    stopLossOrders,
    autoInvestPlans,
    addTransaction,
    updatePosition,
    removePosition,
    updatePrices,
    addExperience,
    addGold,
    addFund,
    withdrawFund,
    recordEquity,
    equityHistory,
    addStopLossOrder,
    cancelStopLossOrder,
    checkStopLossOrders,
    addAutoInvestPlan,
    pauseAutoInvestPlan,
    pauseAutoInvestBySymbol,
    resumeAutoInvestPlan,
    cancelAutoInvestPlan,
    checkAutoInvestPlans,
    markAutoInvestExecuted,
    incrementProfitableSells,
  } = useUserStore()

  const { 
    assets, 
    kbarData, 
    generateInitialAssets, 
    updatePrices: marketUpdatePrices,
    marketIndex,
    news,
    generateNews,
    applyNewsImpact,
    markNewsRead,
  } = useMarketStore()

  const upCount = assets.filter(a => a.change > 0).length
  const downCount = assets.filter(a => a.change < 0).length
  const flatCount = assets.filter(a => a.change === 0).length
  const totalPL = positions.reduce((sum, p) => {
    const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
    return sum + (p.currentPrice - p.avgCost) * p.quantity * contractMultiplier
  }, 0)

  useEffect(() => {
    if (assets.length === 0) {
      generateInitialAssets();
    }
  }, [assets.length, generateInitialAssets]);

  // 更新倒计时
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      marketUpdatePrices()
      const priceMap: Record<string, number> = {}
      assets.forEach(a => {
        priceMap[a.symbol] = a.price
      })
      updatePrices(priceMap)
      recordEquity()

      // 检查止损单
      const triggeredOrders = checkStopLossOrders(priceMap)
      triggeredOrders.forEach(({ order, symbol, price }) => {
        const position = positions.find(p => p.symbol === symbol)
        if (position && position.quantity >= order.quantity) {
          // 执行止损卖出
          const sellQuantity = Math.min(order.quantity, position.quantity)
          const commission = price * sellQuantity * 0.0003
          const proceeds = price * sellQuantity - commission

          if (position.quantity === sellQuantity) {
            removePosition(position.id)
          } else {
            updatePosition({
              ...position,
              quantity: position.quantity - sellQuantity,
              currentPrice: price,
            })
          }

          addFund(proceeds)
          addTransaction({
            id: `tx_${Date.now()}`,
            timestamp: Date.now(),
            type: 'sell',
            symbol: order.symbol,
            name: order.name,
            price,
            quantity: sellQuantity,
            commission,
          })
          // 止损触发后暂停该股票的所有定投计划
          pauseAutoInvestBySymbol(symbol)
        }
      })

      // 检查定投计划
      const executedPlans = checkAutoInvestPlans(priceMap)
      executedPlans.forEach(({ plan, symbol, price }) => {
        // plan.amount 单位：手，每手100股
        const maxQuantity = plan.amount * 100
        const commission = price * maxQuantity * 0.0003
        const actualCost = price * maxQuantity + commission

        if (actualCost > availableFund) return

        // 执行定投买入
        const success = withdrawFund(actualCost)
        if (!success) return

        // 标记计划已执行（只在买入成功后才更新）
        markAutoInvestExecuted(plan.id)

        const existingPosition = useUserStore.getState().positions.find(p => p.symbol === symbol)
        if (existingPosition) {
          const newQuantity = existingPosition.quantity + maxQuantity
          const newAvgCost =
            (existingPosition.avgCost * existingPosition.quantity + price * maxQuantity) / newQuantity

          updatePosition({
            ...existingPosition,
            quantity: newQuantity,
            avgCost: newAvgCost,
            currentPrice: price,
          })
        } else {
          updatePosition({
            id: `pos_${Date.now()}`,
            symbol: plan.symbol,
            name: plan.name,
            quantity: maxQuantity,
            avgCost: price,
            currentPrice: price,
            buyDate: Date.now(),
            canSell: true,
            assetType: 'stock' as const,
          })
        }

        addTransaction({
          id: `tx_${Date.now()}`,
          timestamp: Date.now(),
          type: 'buy',
          symbol: plan.symbol,
          name: plan.name,
          price,
          quantity: maxQuantity,
          commission,
        })
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [assets, marketUpdatePrices, updatePrices, recordEquity, checkStopLossOrders, positions, removePosition, updatePosition, addFund, addTransaction, checkAutoInvestPlans, markAutoInvestExecuted, availableFund, withdrawFund, pauseAutoInvestBySymbol])

  useEffect(() => {
    const newsInterval = setInterval(() => {
      generateNews()
    }, 15000)
    return () => clearInterval(newsInterval)
  }, [generateNews])

  // 计算用户收益率曲线
  const userReturnData = useMemo(() => {
    if (equityHistory.length < 2) return []
    const initialValue = equityHistory[0].value
    return equityHistory.map((point, index) => ({
      time: index,
      returnPercent: ((point.value - initialValue) / initialValue) * 100,
    }))
  }, [equityHistory])

  // 计算市场指数收益率
  const marketReturnData = useMemo(() => {
    if (marketIndex.history.length < 2) return []
    const initialValue = marketIndex.history[0].value
    return marketIndex.history.map((point) => ({
      time: point.time,
      returnPercent: ((point.value - initialValue) / initialValue) * 100,
    }))
  }, [marketIndex.history])

  const handleTrade = useCallback(() => {
    if (!selectedAsset) return

    const asset = assets.find(a => a.symbol === selectedAsset)
    if (!asset) return

    const price = priceType === 'market' ? asset.price : limitPrice
    const commission = price * quantity * 0.0003

    // 计算合约价值（期权和期货可能有合约乘数）
    const contractMultiplier = asset.type === 'future' && asset.contractSize ? asset.contractSize : 1
    const contractValue = price * quantity * contractMultiplier
    
    // 计算保证金要求
    let marginRequired = 0
    if (asset.type === 'future' && asset.marginRatio) {
      marginRequired = contractValue * asset.marginRatio
    } else if (asset.type === 'option') {
      // 期权买方支付权利金，期权卖方（暂时不支持）
      marginRequired = contractValue // 期权买方支付全额权利金
    } else {
      marginRequired = contractValue * (1 + 0.0003) // 股票/基金支付全额
    }

    const totalCost = marginRequired + commission

    if (tradeType === 'buy') {
      if (totalCost > availableFund) {
        alert('可用资金不足')
        return
      }

      // 扣除可用资金
      withdrawFund(totalCost)

      const existingPosition = positions.find(p => p.symbol === selectedAsset)
      if (existingPosition) {
        const newQuantity = existingPosition.quantity + quantity
        const newAvgCost =
          (existingPosition.avgCost * existingPosition.quantity + price * quantity) / newQuantity

        updatePosition({
          ...existingPosition,
          quantity: newQuantity,
          avgCost: newAvgCost,
          currentPrice: price,
        })
      } else {
        updatePosition({
          id: `pos_${Date.now()}`,
          symbol: asset.symbol,
          name: asset.name,
          quantity,
          avgCost: price,
          currentPrice: price,
          buyDate: Date.now(),
          canSell: true,
          assetType: asset.type,
          // 期权特定属性
          optionType: asset.optionType,
          strikePrice: asset.strikePrice,
          // 期货特定属性
          margin: asset.type === 'future' ? marginRequired : undefined,
          contractSize: asset.contractSize,
        })
      }

      addTransaction({
        id: `tx_${Date.now()}`,
        timestamp: Date.now(),
        type: 'buy',
        symbol: asset.symbol,
        name: asset.name,
        price,
        quantity,
        commission,
      })
    } else {
      const position = positions.find(p => p.symbol === selectedAsset)
      if (!position || position.quantity < quantity) {
        alert('持仓数量不足')
        return
      }

      if (position.quantity === quantity) {
        removePosition(position.id)
      } else {
        updatePosition({
          ...position,
          quantity: position.quantity - quantity,
          currentPrice: price,
        })
      }

      // 计算退还的保证金（期货）或权利金（期权）
      let refundAmount = 0
      if (position.assetType === 'future' && position.margin) {
        // 期货卖出，退还保证金 + 盈亏
        const positionContractMultiplier = position.contractSize || 1
        const positionContractValue = price * quantity * positionContractMultiplier
        const originalContractValue = position.avgCost * quantity * positionContractMultiplier
        const profit = positionContractValue - originalContractValue
        refundAmount = position.margin + profit - commission
      } else if (position.assetType === 'option') {
        // 期权卖出，获得权利金
        const positionContractMultiplier = position.contractSize || 1
        refundAmount = price * quantity * positionContractMultiplier - commission
      } else {
        // 股票/基金卖出
        refundAmount = price * quantity - commission
      }

      addFund(refundAmount)

      addTransaction({
        id: `tx_${Date.now()}`,
        timestamp: Date.now(),
        type: 'sell',
        symbol: asset.symbol,
        name: asset.name,
        price,
        quantity,
        commission,
      })

      // 计算盈亏（用于经验和金币奖励）
      const positionContractMultiplier = (position.assetType === 'future' || position.assetType === 'option') && position.contractSize ? position.contractSize : 1
      const profit = (price - position.avgCost) * quantity * positionContractMultiplier - commission
      if (profit > 0) {
        addExperience(Math.floor(profit / 10))
        addGold(Math.floor(profit / 5))
        incrementProfitableSells()
      }
    }

    setShowConfirm(false)
  }, [
    selectedAsset,
    assets,
    priceType,
    limitPrice,
    quantity,
    tradeType,
    availableFund,
    positions,
    updatePosition,
    removePosition,
    addTransaction,
    addExperience,
    addGold,
    addFund,
    withdrawFund,
    incrementProfitableSells,
  ])

  // 止损单相关函数
  const handleOpenStopLossModal = useCallback((positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    if (position) {
      setStopLossPositionId(positionId)
      // 默认止损价格设置为比当前价格的 95%
      setStopLossPrice(Math.floor(position.currentPrice * 0.95))
      setShowStopLossModal(true)
    }
  }, [positions])

  const handleSetStopLoss = useCallback(() => {
    if (!stopLossPositionId) return
    const position = positions.find(p => p.id === stopLossPositionId)
    if (!position) return

    addStopLossOrder({
      symbol: position.symbol,
      name: position.name,
      quantity: position.quantity,
      stopPrice: stopLossPrice,
    })

    setShowStopLossModal(false)
    setStopLossPositionId(null)
  }, [stopLossPositionId, positions, stopLossPrice, addStopLossOrder])

  const activeStopLossOrders = stopLossOrders.filter(o => o.status === 'active')
  const activeAutoInvestPlans = autoInvestPlans.filter(p => p.status === 'active' || p.status === 'paused')

  // 计算风险指标
  const calculateRiskMetrics = useMemo(() => {
    if (positions.length === 0) return null

    const totalAsset = availableFund + positions.reduce((sum, p) => {
      const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
      return sum + p.currentPrice * p.quantity * contractMultiplier
    }, 0)
    const totalPositionValue = positions.reduce((sum, p) => {
      const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
      return sum + p.currentPrice * p.quantity * contractMultiplier
    }, 0)
    
    // 计算仓位集中度
    const positionValues = positions.map(p => {
      const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
      return p.currentPrice * p.quantity * contractMultiplier
    })
    const maxPositionValue = Math.max(...positionValues)
    const maxPositionRatio = totalPositionValue > 0 ? (maxPositionValue / totalPositionValue) : 0
    
    // 计算资产配置比例
    const cashRatio = totalAsset > 0 ? (availableFund / totalAsset) : 0
    const positionRatio = totalAsset > 0 ? (totalPositionValue / totalAsset) : 0
    
    // 评估风险等级
    let riskLevel = '低'
    let riskColor = '#2a9d8f'
    if (maxPositionRatio > 0.5 || positionRatio > 0.8) {
      riskLevel = '高'
      riskColor = '#e63946'
    } else if (maxPositionRatio > 0.3 || positionRatio > 0.6) {
      riskLevel = '中'
      riskColor = '#f39c12'
    }

    // 计算风险提示
    const warnings = []
    if (maxPositionRatio > 0.5) {
      warnings.push('单只持仓过于集中，建议分散投资')
    }
    if (positionRatio > 0.8) {
      warnings.push('仓位过重，建议保留更多现金')
    }
    if (positions.length === 1) {
      warnings.push('持有单一标的，建议分散投资')
    }

    return {
      totalAsset,
      totalPositionValue,
      cashRatio,
      positionRatio,
      maxPositionRatio,
      maxPositionName: positions.find(p => p.currentPrice * p.quantity === maxPositionValue)?.name || '',
      riskLevel,
      riskColor,
      warnings
    }
  }, [positions, availableFund])

  // 定投相关函数
  const handleOpenAutoInvestModal = useCallback((asset: any) => {
    setAutoInvestAsset(asset)
    setAutoInvestAmount(1)
    setAutoInvestInterval('weekly')
    setShowAutoInvestModal(true)
  }, [])

  const handleCreateAutoInvestPlan = useCallback(() => {
    if (!autoInvestAsset) return
    
    addAutoInvestPlan({
      symbol: autoInvestAsset.symbol,
      name: autoInvestAsset.name,
      amount: autoInvestAmount,
      interval: autoInvestInterval,
    })
    
    setShowAutoInvestModal(false)
    setAutoInvestAsset(null)
  }, [autoInvestAsset, autoInvestAmount, autoInvestInterval, addAutoInvestPlan])

  const currentAsset = assets.find(a => a.symbol === selectedAsset)
  const currentPosition = positions.find(p => p.symbol === selectedAsset)
  const currentKbars = selectedAsset ? kbarData[selectedAsset] || [] : []
  
  // 过滤资产
  const filteredAssets = assets.filter(asset => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'stock') return asset.type === 'stock'
    if (selectedTab === 'fund') return asset.type === 'fund'
    if (selectedTab === 'option') return asset.type === 'option'
    if (selectedTab === 'future') return asset.type === 'future'
    return true
  })

  // 当切换分类时，检查选中的资产是否在当前分类中
  useEffect(() => {
    if (selectedAsset) {
      const asset = assets.find(a => a.symbol === selectedAsset)
      if (asset) {
        const isInCurrentTab = selectedTab === 'all' || asset.type === selectedTab
        if (!isInCurrentTab) {
          setSelectedAsset(null)
        }
      }
    }
  }, [selectedTab, selectedAsset, assets])

  return (
    <div className="simulator">
      <div className="simulator-header">
        <h1>📈 投资模拟</h1>
        <p>使用虚拟资金练习投资操作</p>
      </div>

      <div className="market-overview">
        <div className="overview-card">
          <div className="overview-label">涨跌统计</div>
          <div className="overview-value">
            <span className="up">上涨 {upCount}</span>
            <span className="separator">|</span>
            <span className="down">下跌 {downCount}</span>
            {flatCount > 0 && (
              <>
                <span className="separator">|</span>
                <span className="flat">平盘 {flatCount}</span>
              </>
            )}
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-label">持仓盈亏</div>
          <div className={`overview-value ${totalPL >= 0 ? 'profit' : 'loss'}`}>
            {totalPL >= 0 ? '+' : ''}¥{totalPL.toLocaleString()}
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-label">可用资金</div>
          <div className="overview-value">¥{availableFund.toLocaleString()}</div>
        </div>
      </div>

      <div className="panel-tabs">
        <button 
          className={`panel-tab ${activePanel === 'market' ? 'active' : ''}`}
          onClick={() => setActivePanel('market')}
        >
          市场行情
        </button>
        <button 
          className={`panel-tab ${activePanel === 'news' ? 'active' : ''}`}
          onClick={() => setActivePanel('news')}
        >
          市场新闻
        </button>
        <button 
          className={`panel-tab ${activePanel === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActivePanel('portfolio')}
        >
          我的账户
        </button>
      </div>

      <div className="simulator-content">
        {activePanel === 'market' ? (
          <>
            <div className="market-panel">
              <div className="panel-header">
                <h3>行情列表</h3>
                <span className="update-time">实时更新中</span>
              </div>

              <div className="asset-tabs">
                <button 
                  className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('all')}
                >
                  全部
                </button>
                <button 
                  className={`tab ${selectedTab === 'stock' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('stock')}
                >
                  股票
                </button>
                <button 
                  className={`tab ${selectedTab === 'fund' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('fund')}
                >
                  基金
                </button>
                <button 
                  className={`tab ${selectedTab === 'option' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('option')}
                >
                  期权
                </button>
                <button 
                  className={`tab ${selectedTab === 'future' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('future')}
                >
                  期货
                </button>
              </div>

              <div className="asset-list">
                {filteredAssets.map(asset => {
                  const limitRate = asset.board === 'main' ? 0.10 : 0.20
                  const changePercent = Math.abs(asset.changePercent)
                  const isLimitUp = changePercent >= limitRate * 98 && asset.change >= 0
                  const isLimitDown = changePercent >= limitRate * 98 && asset.change < 0
                  const hasAutoPlan = activeAutoInvestPlans.some(p => p.symbol === asset.symbol)
                  
                  return (
                    <motion.div
                      key={asset.symbol}
                      className={`asset-item ${selectedAsset === asset.symbol ? 'selected' : ''} ${isLimitUp ? 'limit-up' : ''} ${isLimitDown ? 'limit-down' : ''}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div 
                        className="asset-main"
                        onClick={() => {
                          setSelectedAsset(asset.symbol)
                          setLimitPrice(asset.price)
                        }}
                      >
                        <div className="asset-info">
                          <span className="asset-name">{asset.name}</span>
                          <span className="asset-symbol">{asset.symbol}</span>
                          {/* 期权特定信息 */}
                          {asset.type === 'option' && asset.optionType && (
                            <span className={`option-type-tag ${asset.optionType}`}>
                              {asset.optionType === 'call' ? '📈 认购' : '📉 认沽'}
                            </span>
                          )}
                          {asset.type === 'option' && asset.strikePrice && (
                            <span className="strike-tag">
                              行权价: ¥{asset.strikePrice.toFixed(2)}
                            </span>
                          )}
                          {/* 期货特定信息 */}
                          {asset.type === 'future' && asset.contractSize && (
                            <span className="contract-tag">
                              合约乘数: {asset.contractSize}
                            </span>
                          )}
                          {asset.type === 'future' && asset.marginRatio && (
                            <span className="margin-tag">
                              保证金: {(asset.marginRatio * 100).toFixed(0)}%
                            </span>
                          )}
                          {isLimitUp && <span className="limit-tag limit-up-tag">涨停</span>}
                          {isLimitDown && <span className="limit-tag limit-down-tag">跌停</span>}
                          {hasAutoPlan && asset.type !== 'option' && asset.type !== 'future' && (
                            <span className="auto-invest-tag">📊 定投中</span>
                          )}
                        </div>
                        <div className="asset-price">
                          <span className="price">¥{asset.price.toFixed(2)}</span>
                          <span className={`change ${asset.change >= 0 ? 'up' : 'down'}`}>
                            {asset.change >= 0 ? '+' : ''}
                            {asset.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      {asset.type !== 'option' && asset.type !== 'future' && (
                        <button
                          className="auto-invest-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenAutoInvestModal(asset)
                          }}
                        >
                          定投
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="chart-panel">
              {currentAsset ? (
                <>
                  <div className="chart-header">
                    <div className="current-asset">
                      <span className="asset-name">{currentAsset.name}</span>
                      <span className="asset-symbol">{currentAsset.symbol}</span>
                    </div>
                    <div className="current-price">
                      <span className="price">¥{currentAsset.price.toFixed(2)}</span>
                      <span className={`change ${currentAsset.change >= 0 ? 'up' : 'down'}`}>
                        {currentAsset.change >= 0 ? '↑' : '↓'} {Math.abs(currentAsset.change).toFixed(2)} (
                        {currentAsset.change >= 0 ? '+' : ''}
                        {currentAsset.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="chart-container">
                    <KLineChart data={currentKbars} symbol={currentAsset.symbol} />
                  </div>

                  {currentPosition && (
                    <div className="position-info">
                      <h4>我的持仓</h4>
                      <div className="position-stats">
                        <div className="stat">
                          <span className="label">持仓数量</span>
                          <span className="value">{currentPosition.quantity}{currentPosition.assetType === 'future' ? '手' : '股'}</span>
                        </div>
                        {(currentPosition.assetType === 'option' || currentPosition.assetType === 'future') && currentPosition.contractSize && (
                          <div className="stat">
                            <span className="label">合约乘数</span>
                            <span className="value">{currentPosition.contractSize}</span>
                          </div>
                        )}
                        {currentPosition.assetType === 'future' && currentPosition.margin && (
                          <div className="stat">
                            <span className="label">占用保证金</span>
                            <span className="value">¥{currentPosition.margin.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="stat">
                          <span className="label">成本价</span>
                          <span className="value">¥{currentPosition.avgCost.toFixed(2)}</span>
                        </div>
                        <div className="stat">
                          <span className="label">当前价</span>
                          <span className="value">¥{currentPosition.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="stat">
                          <span className="label">盈亏</span>
                          <span
                            className={`value ${
                              (() => {
                                const contractMultiplier = (currentPosition.assetType === 'future' || currentPosition.assetType === 'option') && currentPosition.contractSize ? currentPosition.contractSize : 1
                                return (currentPosition.currentPrice - currentPosition.avgCost) * currentPosition.quantity * contractMultiplier >= 0
                              })()
                                ? 'profit'
                                : 'loss'
                            }`}
                          >
                            {(
                              (() => {
                                const contractMultiplier = (currentPosition.assetType === 'future' || currentPosition.assetType === 'option') && currentPosition.contractSize ? currentPosition.contractSize : 1
                                return (currentPosition.currentPrice - currentPosition.avgCost) * currentPosition.quantity * contractMultiplier
                              })()
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selection">
                  <span className="icon">📊</span>
                  <p>请从左侧选择一个资产查看详情</p>
                </div>
              )}
            </div>

            <div className="trade-panel">
              <div className="panel-header">
                <h3>交易操作</h3>
              </div>

              {selectedAsset && currentAsset ? (
                <>
                  <div className="trade-type-selector">
                    <button
                      className={`type-btn ${tradeType === 'buy' ? 'active buy' : ''}`}
                      onClick={() => setTradeType('buy')}
                    >
                      买入
                    </button>
                    <button
                      className={`type-btn ${tradeType === 'sell' ? 'active sell' : ''}`}
                      onClick={() => setTradeType('sell')}
                      disabled={!currentPosition}
                    >
                      卖出
                    </button>
                  </div>

                  <div className="price-type-selector">
                    <label>
                      <input
                        type="radio"
                        name="priceType"
                        checked={priceType === 'market'}
                        onChange={() => setPriceType('market')}
                      />
                      市价
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="priceType"
                        checked={priceType === 'limit'}
                        onChange={() => setPriceType('limit')}
                      />
                      限价
                    </label>
                  </div>

                  {priceType === 'limit' && (
                    <div className="limit-price-input">
                      <label>限价 (¥)</label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="quantity-input">
                    <label>数量 (手)</label>
                    <div className="quantity-controls">
                      <button onClick={() => setQuantity(Math.max(100, quantity - 100))}>-100</button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(100, parseInt(e.target.value) || 0))}
                      />
                      <button onClick={() => setQuantity(quantity + 100)}>+100</button>
                    </div>
                    <span className="hint">
                      {currentAsset.type === 'future' ? '期货按手交易' : '每手 = 100股'}
                    </span>
                  </div>

                  <div className="trade-summary">
                    <div className="summary-row">
                      <span>成交价格</span>
                      <span>¥{(priceType === 'market' ? currentAsset.price : limitPrice).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>数量</span>
                      <span>{quantity}{currentAsset.type === 'future' ? '手' : '股'}</span>
                    </div>
                    {/* 期权和期货特定信息 */}
                    {(currentAsset.type === 'option' || currentAsset.type === 'future') && currentAsset.contractSize && (
                      <div className="summary-row">
                        <span>合约乘数</span>
                        <span>{currentAsset.contractSize}</span>
                      </div>
                    )}
                    {currentAsset.type === 'future' && currentAsset.marginRatio && (
                      <div className="summary-row">
                        <span>保证金率</span>
                        <span>{(currentAsset.marginRatio * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>手续费</span>
                      <span>¥{(currentAsset.price * quantity * 0.0003).toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>预计{tradeType === 'buy' ? '支出' : '收入'}</span>
                      <span>
                        ¥
                        {(
                          (() => {
                            const price = priceType === 'market' ? currentAsset.price : limitPrice
                            const contractMultiplier = currentAsset.type === 'future' && currentAsset.contractSize ? currentAsset.contractSize : 1
                            const commission = price * quantity * 0.0003
                            
                            if (tradeType === 'buy') {
                              if (currentAsset.type === 'future' && currentAsset.marginRatio) {
                                return price * quantity * contractMultiplier * currentAsset.marginRatio + commission
                              } else if (currentAsset.type === 'option') {
                                return price * quantity * contractMultiplier + commission
                              } else {
                                return price * quantity * (1 + 0.0003)
                              }
                            } else {
                              return price * quantity * contractMultiplier - commission
                            }
                          })()
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    className={`trade-btn ${tradeType}`}
                    onClick={() => setShowConfirm(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tradeType === 'buy' ? '买入' : '卖出'} {currentAsset.name}
                  </motion.button>

                  {currentPosition && tradeType === 'sell' && (
                    <div className="quick-sell">
                      <span>持仓 {currentPosition.quantity} 股</span>
                      <button
                        onClick={() => {
                          setQuantity(currentPosition.quantity)
                        }}
                      >
                        全卖
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selection">
                  <p>请先选择要交易的资产</p>
                </div>
              )}
            </div>
          </>
        ) : activePanel === 'portfolio' ? (
          <div className="portfolio-panel">
            <div className="panel-header">
              <h3>收益曲线</h3>
              <div className="index-info">
                <span className="index-name">{marketIndex.name}</span>
                <span className={`index-change ${marketIndex.changePercent >= 0 ? 'profit' : 'loss'}`}>
                  {marketIndex.changePercent >= 0 ? '+' : ''}{marketIndex.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="equity-chart">
              {equityHistory.length > 1 ? (
                <div className="chart-visual-svg">
                  <svg width="100%" height="100%" viewBox="0 0 600 300">
                    {/* X轴和Y轴 */}
                    <line x1="50" y1="280" x2="580" y2="280" stroke="#ccc" strokeWidth="1" />
                    <line x1="50" y1="20" x2="50" y2="280" stroke="#ccc" strokeWidth="1" />
                    
                    {/* 基准线 0% */}
                    <line x1="50" y1="150" x2="580" y2="150" stroke="#ddd" strokeWidth="1" strokeDasharray="4,4" />
                    <text x="40" y="153" fill="#888" fontSize="10">0%</text>
                    
                    {/* 用户收益率曲线 */}
                    {userReturnData.length > 0 && (
                      <polyline
                        points={userReturnData.map((d, i) => {
                          const x = 50 + (i / (userReturnData.length - 1)) * 530
                          const y = Math.max(20, Math.min(280, 150 - (d.returnPercent * 5)))
                          return `${x},${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="#4ECDC4"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    
                    {/* 市场指数曲线 */}
                    {marketReturnData.length > 0 && (
                      <polyline
                        points={marketReturnData.map((d, i) => {
                          const x = 50 + (i / (marketReturnData.length - 1)) * 530
                          const y = Math.max(20, Math.min(280, 150 - (d.returnPercent * 5)))
                          return `${x},${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="#FF6B6B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="5,5"
                      />
                    )}

                    {/* 图例 */}
                    <circle cx="70" cy="35" r="4" fill="#4ECDC4" />
                    <text x="82" y="38" fill="#555" fontSize="12">你的收益率</text>
                    
                    <circle cx="180" cy="35" r="4" fill="#FF6B6B" />
                    <text x="192" y="38" fill="#555" fontSize="12">市场指数</text>
                    <text x="192" y="48" fill="#999" fontSize="10">(虚线)</text>
                    
                    {/* X轴标签 */}
                    {equityHistory.map((record, index) => {
                      const x = 50 + (index / (equityHistory.length - 1)) * 530
                      return (
                        <text 
                          key={record.date} 
                          x={x} 
                          y="295" 
                          fill="#888" 
                          fontSize="10" 
                          textAnchor="middle"
                        >
                          {record.date.slice(5)}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              ) : (
                <div className="no-chart">
                  <span className="icon">📈</span>
                  <p>开始交易后，收益曲线会在这里显示</p>
                </div>
              )}
            </div>
            <div className="portfolio-stats">
              <div className="stat-card">
                <div className="stat-label">初始资金</div>
                <div className="stat-value">¥100,000</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">当前资产</div>
                <div className="stat-value">¥{(availableFund + positions.reduce((sum, p) => {
                  const contractMultiplier = (p.assetType === 'future' || p.assetType === 'option') && p.contractSize ? p.contractSize : 1
                  return sum + p.currentPrice * p.quantity * contractMultiplier
                }, 0)).toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">总收益率</div>
                <div className={`stat-value ${totalPL >= 0 ? 'profit' : 'loss'}`}>
                  {((totalPL / 100000) * 100).toFixed(2)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">持仓数量</div>
                <div className="stat-value">{positions.length}</div>
              </div>
            </div>
            {/* 超额收益统计 */}
            {userReturnData.length > 0 && marketReturnData.length > 0 && (
              <div className="excess-return">
                <div className="excess-item">
                  <span className="excess-label">你的收益率</span>
                  <span className={`excess-value ${userReturnData[userReturnData.length - 1].returnPercent >= 0 ? 'profit' : 'loss'}`}>
                    {userReturnData[userReturnData.length - 1].returnPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="excess-item">
                  <span className="excess-label">超额收益</span>
                  <span className={`excess-value ${(userReturnData[userReturnData.length - 1].returnPercent - (marketReturnData[marketReturnData.length - 1]?.returnPercent || 0)) >= 0 ? 'profit' : 'loss'}`}>
                    {((userReturnData[userReturnData.length - 1].returnPercent - (marketReturnData[marketReturnData.length - 1]?.returnPercent || 0))).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {/* 风险分析报告 */}
            {calculateRiskMetrics && (
              <div className="risk-analysis-section">
                <h3 className="risk-analysis-title">🎯 风险分析报告</h3>
                
                <div className="risk-level-card">
                  <span className="risk-label">风险等级</span>
                  <span className="risk-value" style={{ color: calculateRiskMetrics.riskColor }}>
                    {calculateRiskMetrics.riskLevel}
                  </span>
                </div>

                <div className="risk-metrics-grid">
                  <div className="risk-metric-item">
                    <span className="risk-metric-label">现金比例</span>
                    <span className="risk-metric-value">{(calculateRiskMetrics.cashRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="risk-metric-item">
                    <span className="risk-metric-label">持仓比例</span>
                    <span className="risk-metric-value">{(calculateRiskMetrics.positionRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="risk-metric-item">
                    <span className="risk-metric-label">最大单仓</span>
                    <span className="risk-metric-value">{(calculateRiskMetrics.maxPositionRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="risk-metric-item">
                    <span className="risk-metric-label">持仓数量</span>
                    <span className="risk-metric-value">{positions.length}只</span>
                  </div>
                </div>

                {calculateRiskMetrics.warnings.length > 0 && (
                  <div className="risk-warnings">
                    <h4>⚠️ 风险提示</h4>
                    <ul>
                      {calculateRiskMetrics.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="investment-suggestions">
                  <h4>💡 投资建议</h4>
                  <ul>
                    <li>建议单只持仓不超过总资产的30%</li>
                    <li>保持30%以上的现金比例以应对波动</li>
                    <li>分散投资于5只以上不同的标的</li>
                    <li>设置止损单来控制风险</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 市场新闻页面 - 只显示新闻 */
          <div className="news-panel-container-full">
            <div className="panel-header">
              <h3>📰 市场新闻</h3>
              <button className="refresh-news" onClick={() => generateNews()}>
                刷新新闻
              </button>
            </div>
            <div className="news-list">
              {news.length > 0 ? (
                news.map((item: NewsItem) => (
                  <div 
                    key={item.id} 
                    className={`news-item ${item.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      if (!item.read) {
                        applyNewsImpact(item.id)
                        markNewsRead(item.id)
                      }
                    }}
                  >
                    <div className="news-header">
                      <span className={`news-impact ${item.impact}`}>
                        {item.impact === 'positive' ? '▲ 利好' : item.impact === 'negative' ? '▼ 利空' : '● 中性'}
                      </span>
                      <span className="news-time">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className="news-title">{item.title}</h4>
                    <p className="news-content">{item.content}</p>
                    <div className="news-targets">
                      影响：{item.targetSymbols.slice(0, 3).map(sym => {
                        const asset = assets.find(a => a.symbol === sym)
                        return asset?.name || sym
                      }).join('、')}
                      {item.targetSymbols.length > 3 ? `等${item.targetSymbols.length}只` : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-news">
                  <p>暂无新闻，点击上方刷新新闻按钮</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 只在市场行情和我的账户页面显示我的持仓 */}
      {(activePanel === 'market' || activePanel === 'portfolio') && (
        <div className="positions-panel">
          <h3>我的持仓</h3>
          {positions.length > 0 ? (
            <div className="positions-list">
              {positions.map(position => {
                const hasStopLoss = activeStopLossOrders.some(o => o.symbol === position.symbol)
                return (
                  <div
                    key={position.id}
                    className="position-item"
                  >
                    <div 
                      className="position-main"
                      onClick={() => setSelectedAsset(position.symbol)}
                    >
                      <div className="position-name">
                        <span>{position.name}</span>
                        <span className="position-quantity">
                          {position.quantity}{position.assetType === 'future' ? '手' : '股'}
                        </span>
                        {hasStopLoss && <span className="stop-loss-badge">🛡️ 已设止损</span>}
                      </div>
                      <div className="position-value">
                        <div className="value-item">
                          <span className="value-label">市值</span>
                          <span className="current">
                            ¥
                            {(
                              (() => {
                                const contractMultiplier = (position.assetType === 'future' || position.assetType === 'option') && position.contractSize ? position.contractSize : 1
                                return position.currentPrice * position.quantity * contractMultiplier
                              })()
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="value-item">
                          <span className="value-label">盈亏</span>
                          <span
                            className={`pnl ${
                              (() => {
                                const contractMultiplier = (position.assetType === 'future' || position.assetType === 'option') && position.contractSize ? position.contractSize : 1
                                return (position.currentPrice - position.avgCost) * position.quantity * contractMultiplier >= 0
                              })()
                                ? 'profit'
                                : 'loss'
                            }`}
                          >
                            {(
                              (() => {
                                const contractMultiplier = (position.assetType === 'future' || position.assetType === 'option') && position.contractSize ? position.contractSize : 1
                                return (position.currentPrice - position.avgCost) * position.quantity * contractMultiplier
                              })()
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="set-stop-loss-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenStopLossModal(position.id)
                      }}
                    >
                      {hasStopLoss ? '调整止损' : '设置止损'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-positions">
              <p>暂无持仓，去行情列表选择一个资产开始交易吧</p>
            </div>
          )}

          {/* 止损单列表 */}
          {activeStopLossOrders.length > 0 && (
            <div className="stop-loss-section">
              <h4>🛡️ 止损单</h4>
              <div className="stop-loss-list">
                {activeStopLossOrders.map(order => (
                  <div key={order.id} className="stop-loss-item">
                    <div className="stop-loss-info">
                      <span className="stop-loss-name">{order.name}</span>
                      <span className="stop-loss-details">
                        {order.quantity}股 · 止损价 ¥{order.stopPrice.toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="cancel-stop-loss-btn"
                      onClick={() => cancelStopLossOrder(order.id)}
                    >
                      撤销
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 定投计划列表 */}
          {activeAutoInvestPlans.length > 0 && (
            <div className="auto-invest-section">
              <h4>📊 定投计划</h4>
              <div className="auto-invest-list">
                {activeAutoInvestPlans.map(plan => {
                  const intervalText = plan.interval === 'daily' ? '每日' : plan.interval === 'weekly' ? '每周' : '每月'
                  const countdown = Math.max(0, Math.ceil((plan.nextExecuteTime - currentTime) / 1000))
                  return (
                    <div key={plan.id} className="auto-invest-item">
                      <div className="auto-invest-info">
                        <span className="auto-invest-name">{plan.name}</span>
                        <span className="auto-invest-details">
                          {intervalText}投 {plan.amount}手 · 已投{plan.executedCount}次 · 累计{plan.totalInvested}手
                        </span>
                        {plan.status === 'active' && (
                          <span className="auto-invest-countdown">
                            下次: {countdown}秒
                          </span>
                        )}
                        {plan.status === 'paused' && plan.pauseReason === 'stop_loss' && (
                          <span className="auto-invest-stoploss-tag">🛡️ 止损已触发，定投已暂停</span>
                        )}
                      </div>
                      <div className="auto-invest-actions">
                        {plan.status === 'active' ? (
                          <button
                            className="pause-plan-btn"
                            onClick={() => pauseAutoInvestPlan(plan.id)}
                          >
                            暂停
                          </button>
                        ) : (
                          <button
                            className="resume-plan-btn"
                            onClick={() => resumeAutoInvestPlan(plan.id)}
                          >
                            继续
                          </button>
                        )}
                        <button
                          className="cancel-plan-btn"
                          onClick={() => cancelAutoInvestPlan(plan.id)}
                        >
                          撤销
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>确认{tradeType === 'buy' ? '买入' : '卖出'}</h3>
              <div className="confirm-details">
                <p>
                  {tradeType === 'buy' ? '买入' : '卖出'}
                  <strong>{currentAsset?.name}</strong>
                </p>
                <p>
                  数量: <strong>{quantity}股</strong>
                </p>
                <p>
                  价格: <strong>¥{(priceType === 'market' ? currentAsset?.price : limitPrice)?.toFixed(2)}</strong>
                </p>
                <p className="warning">
                  {tradeType === 'buy'
                    ? `将从可用资金 ¥{availableFund.toFixed(2)} 中扣除`
                    : `将获得资金存入可用资金`}
                </p>
              </div>
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowConfirm(false)}>
                  取消
                </button>
                <button
                  className={`confirm-btn ${tradeType}`}
                  onClick={handleTrade}
                >
                  确认{tradeType === 'buy' ? '买入' : '卖出'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showStopLossModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStopLossModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>🛡️ 设置止损</h3>
              <div className="stop-loss-form">
                {stopLossPositionId && (
                  <>
                    <p>
                      持仓: <strong>{positions.find(p => p.id === stopLossPositionId)?.name}</strong>
                    </p>
                    <p>
                      当前价格: <strong>¥{positions.find(p => p.id === stopLossPositionId)?.currentPrice.toFixed(2)}</strong>
                    </p>
                  </>
                )}
                <div className="stop-loss-input-group">
                  <label>止损价格:</label>
                  <input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    placeholder="输入止损价格"
                  />
                </div>
                <p className="stop-loss-tip">
                  当价格跌破止损价时，系统将自动卖出持仓
                </p>
              </div>
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowStopLossModal(false)}>
                  取消
                </button>
                <button className="confirm-btn" onClick={handleSetStopLoss}>
                  确认设置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAutoInvestModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAutoInvestModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>📊 设置定投</h3>
              <div className="auto-invest-form">
                {autoInvestAsset && (
                  <>
                    <p>
                      标的: <strong>{autoInvestAsset.name}</strong>
                    </p>
                    <p>
                      当前价格: <strong>¥{autoInvestAsset.price.toFixed(2)}</strong>
                    </p>
                  </>
                )}
                <div className="auto-invest-input-group">
                  <label>每次定投数量（手，1手=100股）:</label>
                  <input
                    type="number"
                    value={autoInvestAmount}
                    onChange={(e) => setAutoInvestAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    step="1"
                    min="1"
                    placeholder="输入定投手数"
                  />
                </div>
                <div className="auto-invest-interval-group">
                  <label>定投周期:</label>
                  <div className="interval-buttons">
                    <button
                      className={`interval-btn ${autoInvestInterval === 'daily' ? 'active' : ''}`}
                      onClick={() => setAutoInvestInterval('daily')}
                    >
                      每日 (30秒)
                    </button>
                    <button
                      className={`interval-btn ${autoInvestInterval === 'weekly' ? 'active' : ''}`}
                      onClick={() => setAutoInvestInterval('weekly')}
                    >
                      每周 (60秒)
                    </button>
                    <button
                      className={`interval-btn ${autoInvestInterval === 'monthly' ? 'active' : ''}`}
                      onClick={() => setAutoInvestInterval('monthly')}
                    >
                      每月 (120秒)
                    </button>
                  </div>
                </div>
                <p className="auto-invest-tip">
                  定投是一种长期投资策略，通过定期定额投资可以分散风险，平滑成本
                </p>
              </div>
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowAutoInvestModal(false)}>
                  取消
                </button>
                <button className="confirm-btn" onClick={handleCreateAutoInvestPlan}>
                  确认设置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Simulator
