import { useEffect, useRef, useState } from 'react'
import './SavingsAnimation.css'

const TOTAL_DURATION = 75

const SCENES = [
  { start: 0, end: 8, title: '什么是储蓄', subtitle: '把暂时不用的钱，留给未来的自己。' },
  { start: 8, end: 21, title: '今天花掉，还是存起来？', subtitle: '储蓄不是不花钱，而是先安排好钱的去处。' },
  { start: 21, end: 34, title: '钱留住，选择就更多', subtitle: '一点一点存下来的钱，会成为未来的底气。' },
  { start: 34, end: 49, title: '利息从哪里来？', subtitle: '银行把资金借给需要的人和企业，并把一部分利息分享给储户。' },
  { start: 49, end: 62, title: '储蓄的三个好处', subtitle: '延迟消费、资金安全、获得利息。' },
  { start: 62, end: TOTAL_DURATION, title: '一句话记住', subtitle: '储蓄 = 今天的安排 → 明天的选择' },
]

function getSceneIndex(seconds: number) {
  const index = SCENES.findIndex(scene => seconds >= scene.start && seconds < scene.end)
  return index === -1 ? SCENES.length - 1 : index
}

function SavingsAnimation() {
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const elapsedRef = useRef(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)
    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setElapsed(TOTAL_DURATION)
      setIsPlaying(false)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (!isPlaying || reducedMotion) return

    startedAtRef.current = performance.now() - elapsedRef.current * 1000
    const tick = (now: number) => {
      const nextElapsed = Math.min((now - (startedAtRef.current ?? now)) / 1000, TOTAL_DURATION)
      elapsedRef.current = nextElapsed
      setElapsed(nextElapsed)

      if (nextElapsed < TOTAL_DURATION) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setIsPlaying(false)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isPlaying, reducedMotion])

  const replay = () => {
    elapsedRef.current = 0
    setElapsed(0)
    setIsPlaying(true)
  }
  const sceneIndex = getSceneIndex(elapsed)
  const scene = SCENES[sceneIndex]
  const progress = Math.round((elapsed / TOTAL_DURATION) * 100)

  return (
    <section className="savings-animation" aria-label="什么是储蓄动画讲解">
      <div className="savings-animation__stage" data-scene={sceneIndex}>
        <svg viewBox="0 0 960 540" role="img" aria-labelledby="savings-animation-title savings-animation-desc">
          <title id="savings-animation-title">什么是储蓄</title>
          <desc id="savings-animation-desc">通过消费、存钱罐、银行和企业的图解说明储蓄的意义。</desc>
          <defs>
            <linearGradient id="savings-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f7f6f2" />
              <stop offset="100%" stopColor="#e8eef5" />
            </linearGradient>
            <linearGradient id="coin-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f3c56b" />
              <stop offset="100%" stopColor="#d99d32" />
            </linearGradient>
          </defs>
          <rect width="960" height="540" rx="28" fill="url(#savings-bg)" />
          <circle cx="102" cy="86" r="68" fill="#ffffff" opacity="0.58" />
          <circle cx="872" cy="454" r="96" fill="#dce7f2" opacity="0.65" />

          <g className="savings-animation__teacher-slot" aria-hidden="true">
            <circle cx="880" cy="70" r="28" fill="#ffffff" stroke="#8ba3c5" strokeDasharray="5 5" />
            <text x="880" y="75" textAnchor="middle" className="teacher-slot-label">讲解者</text>
          </g>

          <g className="scene scene--title">
            <text x="480" y="220" textAnchor="middle" className="scene-title">什么是储蓄？</text>
            <text x="480" y="265" textAnchor="middle" className="scene-lead">让今天的一点克制，换来明天更多选择</text>
            <path d="M380 308 H580" stroke="#8ba3c5" strokeWidth="4" strokeLinecap="round" />
            <circle cx="412" cy="308" r="10" fill="url(#coin-fill)" />
            <circle cx="480" cy="308" r="10" fill="url(#coin-fill)" />
            <circle cx="548" cy="308" r="10" fill="url(#coin-fill)" />
          </g>

          <g className="scene scene--choice">
            <text x="250" y="125" textAnchor="middle" className="scene-heading">现在花掉</text>
            <text x="710" y="125" textAnchor="middle" className="scene-heading scene-heading--safe">存起来</text>
            <rect x="100" y="160" width="300" height="235" rx="24" fill="#fff" stroke="#e6c8c2" strokeWidth="3" />
            <rect x="560" y="160" width="300" height="235" rx="24" fill="#fff" stroke="#b9d6c7" strokeWidth="3" />
            <text x="250" y="225" textAnchor="middle" className="scene-emoji">🛍️</text>
            <text x="250" y="290" textAnchor="middle" className="scene-copy">钱包里的钱很快花光</text>
            <path d="M195 335 C230 300 270 370 305 330" fill="none" stroke="#d94f4f" strokeWidth="6" strokeLinecap="round" />
            <text x="710" y="238" textAnchor="middle" className="scene-emoji">🐷</text>
            <text x="710" y="302" textAnchor="middle" className="scene-copy">把暂时不用的钱存下来</text>
            <circle cx="650" cy="200" r="13" fill="url(#coin-fill)" />
            <circle cx="710" cy="178" r="13" fill="url(#coin-fill)" />
            <circle cx="770" cy="205" r="13" fill="url(#coin-fill)" />
          </g>

          <g className="scene scene--jar">
            <text x="480" y="118" textAnchor="middle" className="scene-heading">每一次储蓄，都是在给未来增加选择</text>
            <path d="M365 360 Q360 235 480 215 Q600 235 595 360 Q590 420 480 420 Q370 420 365 360" fill="#d7e7f0" stroke="#495b7d" strokeWidth="6" />
            <ellipse cx="480" cy="218" rx="74" ry="22" fill="#ffffff" stroke="#495b7d" strokeWidth="6" />
            <circle cx="480" cy="295" r="44" fill="url(#coin-fill)" />
            <text x="480" y="308" textAnchor="middle" className="coin-mark">¥</text>
            <circle className="jar-coin jar-coin--one" cx="365" cy="160" r="19" fill="url(#coin-fill)" />
            <circle className="jar-coin jar-coin--two" cx="480" cy="140" r="19" fill="url(#coin-fill)" />
            <circle className="jar-coin jar-coin--three" cx="595" cy="160" r="19" fill="url(#coin-fill)" />
            <text x="480" y="475" textAnchor="middle" className="scene-copy">余额会慢慢积累，成为你应对目标和意外的底气。</text>
          </g>

          <g className="scene scene--flow">
            <text x="480" y="110" textAnchor="middle" className="scene-heading">为什么储蓄还能获得利息？</text>
            <g className="flow-node"><circle cx="180" cy="280" r="66" fill="#fff" stroke="#8ba3c5" strokeWidth="4" /><text x="180" y="270" textAnchor="middle" className="flow-icon">👤</text><text x="180" y="320" textAnchor="middle" className="flow-label">储户</text></g>
            <g className="flow-node"><rect x="390" y="215" width="180" height="130" rx="18" fill="#fff" stroke="#495b7d" strokeWidth="4" /><text x="480" y="272" textAnchor="middle" className="flow-icon">🏦</text><text x="480" y="320" textAnchor="middle" className="flow-label">银行</text></g>
            <g className="flow-node"><circle cx="780" cy="280" r="66" fill="#fff" stroke="#8ba3c5" strokeWidth="4" /><text x="780" y="270" textAnchor="middle" className="flow-icon">🏢</text><text x="780" y="320" textAnchor="middle" className="flow-label">企业</text></g>
            <path className="flow-arrow flow-arrow--one" d="M252 280 H365" stroke="#495b7d" strokeWidth="6" markerEnd="url(#arrow)" />
            <path className="flow-arrow flow-arrow--two" d="M580 280 H705" stroke="#495b7d" strokeWidth="6" />
            <path className="flow-return" d="M750 390 C590 480 370 480 210 390" fill="none" stroke="#1a9e6c" strokeWidth="6" strokeDasharray="12 10" />
            <text x="480" y="438" textAnchor="middle" className="flow-return-label">企业支付利息 → 银行分享给储户</text>
          </g>

          <g className="scene scene--benefits">
            <text x="480" y="120" textAnchor="middle" className="scene-heading">储蓄的三个好处</text>
            {[
              ['①', '延迟消费', '把钱用在更重要的目标上'],
              ['②', '资金安全', '为计划和意外留出空间'],
              ['③', '获得利息', '让资金慢慢产生回报'],
            ].map(([number, heading, copy], index) => {
              const x = 105 + index * 290
              return <g className={`benefit-card benefit-card--${index + 1}`} key={heading}>
                <rect x={x} y="190" width="250" height="190" rx="22" fill="#fff" stroke="#d6e0eb" strokeWidth="3" />
                <text x={x + 42} y="242" textAnchor="middle" className="benefit-number">{number}</text>
                <text x={x + 125} y="280" textAnchor="middle" className="benefit-heading">{heading}</text>
                <text x={x + 125} y="325" textAnchor="middle" className="benefit-copy">{copy}</text>
              </g>
            })}
          </g>

          <g className="scene scene--summary">
            <text x="480" y="175" textAnchor="middle" className="scene-heading">记住这一句话</text>
            <rect x="170" y="225" width="620" height="125" rx="28" fill="#fff" stroke="#8ba3c5" strokeWidth="4" />
            <text x="480" y="302" textAnchor="middle" className="summary-copy">储蓄 = 今天的安排 → 明天的选择</text>
            <text x="480" y="410" textAnchor="middle" className="scene-copy">完成后，去测验检验一下你的理解吧。</text>
          </g>
        </svg>
      </div>

      <div className="savings-animation__caption" aria-live="polite">
        <span className="savings-animation__scene-count">{sceneIndex + 1} / {SCENES.length}</span>
        <div><strong>{scene.title}</strong><p>{scene.subtitle}</p></div>
      </div>

      <div className="savings-animation__controls">
        <button type="button" onClick={() => setIsPlaying(value => !value)} disabled={reducedMotion} aria-label={isPlaying ? '暂停动画' : '播放动画'}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button type="button" onClick={replay} aria-label="从头重播动画">重播</button>
        <div className="savings-animation__progress" aria-label={`动画进度 ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="savings-animation__time">{Math.floor(elapsed)} / {TOTAL_DURATION} 秒</span>
      </div>
      {reducedMotion && <p className="savings-animation__motion-note">已遵循系统的减少动画偏好，直接展示课程总结。</p>}
    </section>
  )
}

export default SavingsAnimation
