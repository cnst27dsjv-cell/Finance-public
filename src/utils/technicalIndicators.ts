import type { KBar } from '@/stores/marketStore'

export function calculateMA(data: KBar[], dayCount: number): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < dayCount - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = 0; j < dayCount; j++) {
        sum += data[i - j].close
      }
      result.push(+(sum / dayCount).toFixed(3))
    }
  }

  return result
}

export interface MACDResult {
  dif: (number | null)[]
  dea: (number | null)[]
  macd: (number | null)[]
}

export function calculateMACD(data: KBar[], fast = 12, slow = 26, signal = 9): MACDResult {
  const closes = data.map(item => item.close)
  const dif: (number | null)[] = []
  const dea: (number | null)[] = []
  const macd: (number | null)[] = []

  let emaFast: number | null = null
  let emaSlow: number | null = null
  let deaValue: number | null = null

  for (let i = 0; i < closes.length; i++) {
    if (i < slow - 1) {
      dif.push(null)
      dea.push(null)
      macd.push(null)
      continue
    }

    if (emaFast === null) {
      let sum = 0
      for (let j = 0; j < fast; j++) {
        sum += closes[i - j]
      }
      emaFast = sum / fast
    } else {
      emaFast = (emaFast * (fast - 1) + closes[i] * 2) / (fast + 1)
    }

    if (emaSlow === null) {
      let sum = 0
      for (let j = 0; j < slow; j++) {
        sum += closes[i - j]
      }
      emaSlow = sum / slow
    } else {
      emaSlow = (emaSlow * (slow - 1) + closes[i] * 2) / (slow + 1)
    }

    const difValue = emaFast - emaSlow
    dif.push(difValue)

    if (deaValue === null) {
      let sum = 0
      const startIdx = Math.max(0, i - signal + 1)
      const count = i - startIdx + 1
      for (let j = startIdx; j <= i; j++) {
        sum += dif[j] as number
      }
      deaValue = sum / count
    } else {
      deaValue = (deaValue * (signal - 1) + difValue * 2) / (signal + 1)
    }
    dea.push(deaValue)

    const macdValue = (difValue - deaValue) * 2
    macd.push(macdValue)
  }

  return { dif, dea, macd }
}

export function calculateRSI(data: KBar[], period = 14): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
      continue
    }

    let gains = 0
    let losses = 0

    for (let j = 1; j <= period; j++) {
      const change = data[i - j + 1].close - data[i - j].close
      if (change > 0) {
        gains += change
      } else {
        losses -= change
      }
    }

    const avgGain = gains / period
    const avgLoss = losses / period

    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(+(100 - 100 / (1 + rs)).toFixed(2))
    }
  }

  return result
}

export interface KDJResult {
  k: (number | null)[]
  d: (number | null)[]
  j: (number | null)[]
}

export function calculateKDJ(data: KBar[], n = 9, m1 = 3, m2 = 3): KDJResult {
  const k: (number | null)[] = []
  const d: (number | null)[] = []
  const j: (number | null)[] = []

  let prevK = 50
  let prevD = 50

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      k.push(null)
      d.push(null)
      j.push(null)
      continue
    }

    let lowest = Infinity
    let highest = -Infinity

    for (let jIdx = 0; jIdx < n; jIdx++) {
      lowest = Math.min(lowest, data[i - jIdx].low)
      highest = Math.max(highest, data[i - jIdx].high)
    }

    const rsv = ((data[i].close - lowest) / (highest - lowest)) * 100
    const currentK = (prevK * (m1 - 1) + rsv) / m1
    const currentD = (prevD * (m2 - 1) + currentK) / m2
    const currentJ = 3 * currentK - 2 * currentD

    k.push(+currentK.toFixed(2))
    d.push(+currentD.toFixed(2))
    j.push(+currentJ.toFixed(2))

    prevK = currentK
    prevD = currentD
  }

  return { k, d, j }
}
