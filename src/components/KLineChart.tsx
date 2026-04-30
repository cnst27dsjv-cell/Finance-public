import { useEffect, useRef, useState, useCallback } from 'react'
import * as echarts from 'echarts'
import type { KBar } from '@/stores/marketStore'
import { calculateMA, calculateMACD, calculateRSI, calculateKDJ } from '@/utils/technicalIndicators'
import './KLineChart.css'

interface KLineChartProps {
  data: KBar[]
  symbol: string
}

type IndicatorType = 'none' | 'macd' | 'rsi' | 'kdj'

function KLineChart({ data, symbol }: KLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const [indicator, setIndicator] = useState<IndicatorType>('none')
  const [showMA, setShowMA] = useState(true)

  const renderChart = useCallback(() => {
    if (!chartRef.current || data.length === 0) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
    }

    chartInstanceRef.current = echarts.init(chartRef.current)

    const xData = data.map(item => {
      const date = new Date(item.time)
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    })

    const series: any[] = [
      {
        name: 'K线',
        type: 'candlestick',
        data: data.map(item => [item.open, item.close, item.low, item.high]),
        itemStyle: {
          color: '#FF6B6B',
          color0: '#6BCB77',
          borderColor: '#FF6B6B',
          borderColor0: '#6BCB77',
        },
        emphasis: {
          itemStyle: {
            color: '#FF8B8B',
            color0: '#8BD88B',
            borderColor: '#FF8B8B',
            borderColor0: '#8BD88B',
          },
        },
      },
    ]

    if (showMA) {
      series.push(
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(data, 5),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#FFD93D',
            width: 1,
          },
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(data, 10),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#4ECDC4',
            width: 1,
          },
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(data, 20),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#45B7D1',
            width: 1,
          },
        }
      )
    }

    let gridTop = '10%'
    let gridHeight = '75%'
    let secondYAxis = false

    if (indicator !== 'none') {
      gridTop = '5%'
      gridHeight = '60%'
      secondYAxis = true
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 300,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          const candleData = params.find((p: any) => p.seriesName === 'K线')
          if (!candleData || !candleData.data) return ''
          const [open, close, low, high] = candleData.data
          const color = close >= open ? '#FF6B6B' : '#6BCB77'
          let html = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${symbol}</div>
              <div>开盘: <span style="color: ${color}">¥${open.toFixed(2)}</span></div>
              <div>收盘: <span style="color: ${color}">¥${close.toFixed(2)}</span></div>
              <div>最低: <span style="color: #6BCB77">¥${low.toFixed(2)}</span></div>
              <div>最高: <span style="color: #FF6B6B">¥${high.toFixed(2)}</span></div>
          `
          if (showMA) {
            const ma5 = params.find((p: any) => p.seriesName === 'MA5')
            const ma10 = params.find((p: any) => p.seriesName === 'MA10')
            const ma20 = params.find((p: any) => p.seriesName === 'MA20')
            if (ma5?.data) html += `<div>MA5: <span style="color: #FFD93D">${ma5.data}</span></div>`
            if (ma10?.data) html += `<div>MA10: <span style="color: #4ECDC4">${ma10.data}</span></div>`
            if (ma20?.data) html += `<div>MA20: <span style="color: #45B7D1">${ma20.data}</span></div>`
          }
          html += '</div>'
          return html
        },
      },
      grid: (() => {
        const grids: any = [
          {
            left: '10%',
            right: '10%',
            top: gridTop,
            height: gridHeight,
          },
        ]
        if (secondYAxis) {
          grids.push({
            left: '10%',
            right: '10%',
            top: '70%',
            height: '25%',
          })
        }
        return grids
      })(),
      xAxis: (() => {
        const axes: any = [
          {
            type: 'category',
            data: xData,
            gridIndex: 0,
            axisLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
            axisLabel: {
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: 10,
            },
            splitLine: {
              show: false,
            },
          },
        ]
        if (secondYAxis) {
          axes.push({
            type: 'category',
            data: xData,
            gridIndex: 1,
            axisLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
            },
            axisLabel: {
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: 10,
            },
            splitLine: {
              show: false,
            },
          })
        }
        return axes
      })(),
      yAxis: (() => {
        const axes: any = [
          {
            type: 'value',
            scale: true,
            gridIndex: 0,
            splitArea: {
              show: true,
              areaStyle: {
                color: ['rgba(250, 250, 250, 0.1)', 'rgba(255, 255, 255, 0.05)'],
              },
            },
            axisLine: {
              show: false,
            },
            axisLabel: {
              color: 'rgba(0, 0, 0, 0.5)',
              formatter: (value: number) => `¥${value.toFixed(2)}`,
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
          },
        ];
        if (secondYAxis) {
          axes.push({
            type: 'value',
            scale: true,
            gridIndex: 1,
            splitLine: {
              lineStyle: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            axisLabel: {
              color: 'rgba(0, 0, 0, 0.5)',
            },
          });
        }
        return axes;
      })(),
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, secondYAxis ? 1 : 0],
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0, secondYAxis ? 1 : 0],
          start: 0,
          end: 100,
          height: 15,
          bottom: 0,
          borderColor: 'transparent',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          fillerColor: 'rgba(78, 205, 196, 0.2)',
          handleStyle: {
            color: '#4ECDC4',
          },
        },
      ],
      series,
    }

    if (indicator === 'macd') {
      const macdData = calculateMACD(data)
      const macdSeries = [
        {
          name: 'DIF',
          type: 'line',
          data: macdData.dif,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#FF6B6B',
            width: 1,
          },
        },
        {
          name: 'DEA',
          type: 'line',
          data: macdData.dea,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#4ECDC4',
            width: 1,
          },
        },
        {
          name: 'MACD',
          type: 'bar',
          data: macdData.macd,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: (params: any) => {
              return params.data >= 0 ? '#FF6B6B' : '#6BCB77'
            },
          },
        },
      ]
      option.series = [...(option.series as any[]), ...macdSeries]
    } else if (indicator === 'rsi') {
      const rsiData = calculateRSI(data)
      const rsiSeries = [
        {
          name: 'RSI',
          type: 'line',
          data: rsiData,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#FF6B6B',
            width: 1.5,
          },
        },
        {
          name: '超买线',
          type: 'line',
          data: new Array(data.length).fill(70),
          xAxisIndex: 1,
          yAxisIndex: 1,
          showSymbol: false,
          lineStyle: {
            color: 'rgba(255, 107, 107, 0.3)',
            type: 'dashed',
            width: 1,
          },
        },
        {
          name: '超卖线',
          type: 'line',
          data: new Array(data.length).fill(30),
          xAxisIndex: 1,
          yAxisIndex: 1,
          showSymbol: false,
          lineStyle: {
            color: 'rgba(107, 203, 119, 0.3)',
            type: 'dashed',
            width: 1,
          },
        },
      ]
      option.series = [...(option.series as any[]), ...rsiSeries]
    } else if (indicator === 'kdj') {
      const kdjData = calculateKDJ(data)
      const kdjSeries = [
        {
          name: 'K',
          type: 'line',
          data: kdjData.k,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#FFD93D',
            width: 1,
          },
        },
        {
          name: 'D',
          type: 'line',
          data: kdjData.d,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#4ECDC4',
            width: 1,
          },
        },
        {
          name: 'J',
          type: 'line',
          data: kdjData.j,
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: '#FF6B6B',
            width: 1,
          },
        },
      ]
      option.series = [...(option.series as any[]), ...kdjSeries]
    }

    chartInstanceRef.current.setOption(option)

    const handleResize = () => {
      chartInstanceRef.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data, symbol, indicator, showMA])

  useEffect(() => {
    renderChart()
    return () => {
      chartInstanceRef.current?.dispose()
    }
  }, [renderChart])

  return (
    <div className="kline-chart-container">
      <div className="chart-controls">
        <div className="control-group">
          <span className="control-label">均线:</span>
          <button 
            className={`control-btn ${showMA ? 'active' : ''}`}
            onClick={() => setShowMA(!showMA)}
          >
            MA
          </button>
        </div>
        <div className="control-group">
          <span className="control-label">指标:</span>
          <button 
            className={`control-btn ${indicator === 'none' ? 'active' : ''}`}
            onClick={() => setIndicator('none')}
          >
            无
          </button>
          <button 
            className={`control-btn ${indicator === 'macd' ? 'active' : ''}`}
            onClick={() => setIndicator('macd')}
          >
            MACD
          </button>
          <button 
            className={`control-btn ${indicator === 'rsi' ? 'active' : ''}`}
            onClick={() => setIndicator('rsi')}
          >
            RSI
          </button>
          <button 
            className={`control-btn ${indicator === 'kdj' ? 'active' : ''}`}
            onClick={() => setIndicator('kdj')}
          >
            KDJ
          </button>
        </div>
      </div>
      <div ref={chartRef} className="chart-area" />
    </div>
  )
}

export default KLineChart
