import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/stores/userStore'
import './Learning.css'

interface Course {
  id: string
  level: number
  title: string
  description: string
  icon: string
  lessons: Lesson[]
  unlocked: boolean
  completed: boolean
  contentType: 'video' | 'text'
}

interface Lesson {
  id: string
  title: string
  type: 'animation' | 'reading' | 'quiz'
  duration: string
  completed: boolean
  content?: string
}

const COURSES: Course[] = [
  {
    id: 'L1-1',
    level: 1,
    title: '储蓄基础',
    description: '了解储蓄的本质和复利的魔力',
    icon: '💰',
    unlocked: true,
    completed: false,
    contentType: 'video',
    lessons: [
      { id: 'L1-1-1', title: '什么是储蓄', type: 'animation', duration: '90秒', completed: false },
      { id: 'L1-1-2', title: '单利与复利', type: 'animation', duration: '60秒', completed: false },
      { id: 'L1-1-3', title: '复利的魔力演示', type: 'animation', duration: '90秒', completed: false },
      { id: 'L1-1-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L1-2',
    level: 1,
    title: '货币基金入门',
    description: '认识流动性与收益的平衡',
    icon: '🏦',
    unlocked: true,
    completed: false,
    contentType: 'video',
    lessons: [
      { id: 'L1-2-1', title: '货币基金是什么', type: 'animation', duration: '60秒', completed: false },
      { id: 'L1-2-2', title: '流动性与收益', type: 'animation', duration: '90秒', completed: false },
      { id: 'L1-2-3', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L1-3',
    level: 1,
    title: '债券基础',
    description: '理解债券收益原理',
    icon: '📜',
    unlocked: true,
    completed: false,
    contentType: 'video',
    lessons: [
      { id: 'L1-3-1', title: '债券是什么', type: 'animation', duration: '90秒', completed: false },
      { id: 'L1-3-2', title: '债券的收益来源', type: 'animation', duration: '60秒', completed: false },
      { id: 'L1-3-3', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L1-4',
    level: 1,
    title: '理财产品初探',
    description: '了解各类理财产品',
    icon: '📋',
    unlocked: true,
    completed: false,
    contentType: 'video',
    lessons: [
      { id: 'L1-4-1', title: '银行理财产品', type: 'animation', duration: '60秒', completed: false },
      { id: 'L1-4-2', title: '预期收益与风险', type: 'animation', duration: '90秒', completed: false },
      { id: 'L1-4-3', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L2-1',
    level: 2,
    title: '基金分类',
    description: '了解不同类型基金的特点',
    icon: '📊',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L2-1-1', title: '基金家族大聚会', type: 'reading', duration: '图文', completed: false, content: '基金家族有很多成员：股票型、债券型、混合型...它们各有特色！' },
      { id: 'L2-1-2', title: '风险收益对比', type: 'reading', duration: '图文', completed: false, content: '不同基金的风险和收益不一样，高收益伴随高风险！' },
      { id: 'L2-1-3', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L2-2',
    level: 2,
    title: '定投策略',
    description: '学习定投的微笑曲线',
    icon: '⏰',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L2-2-1', title: '什么是定投', type: 'reading', duration: '图文', completed: false, content: '定投就是定期定额投资，省心又省力！' },
      { id: 'L2-2-2', title: '微笑曲线的魔力', type: 'reading', duration: '图文', completed: false, content: '市场波动时，定投可以摊低成本！' },
      { id: 'L2-2-3', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L2-3',
    level: 2,
    title: '基金评价指标',
    description: '学会看夏普比率、最大回撤等指标',
    icon: '📈',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L2-3-1', title: '夏普比率是什么', type: 'reading', duration: '图文', completed: false, content: '夏普比率衡量的是每承担一单位风险能获得多少超额收益，越高越好！' },
      { id: 'L2-3-2', title: '最大回撤很重要', type: 'reading', duration: '图文', completed: false, content: '最大回撤是历史上从最高点跌到最低点的幅度，反映了基金的风险大小！' },
      { id: 'L2-3-3', title: '其他参考指标', type: 'reading', duration: '图文', completed: false, content: '还有波动率、换手率、跟踪误差等指标，可以帮你更全面地评估基金！' },
      { id: 'L2-3-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L2-4',
    level: 2,
    title: '分散投资',
    description: '学习资产配置和相关性',
    icon: '🎨',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L2-4-1', title: '不要把鸡蛋放一个篮子', type: 'reading', duration: '图文', completed: false, content: '分散投资就是不要把钱都投在同一个地方，降低单一资产的风险！' },
      { id: 'L2-4-2', title: '资产配置三原则', type: 'reading', duration: '图文', completed: false, content: '根据你的风险承受能力、投资期限、理财目标来配置不同类型的资产！' },
      { id: 'L2-4-3', title: '相关性很重要', type: 'reading', duration: '图文', completed: false, content: '选择相关性低的资产组合，比如股票和债券搭配，可以起到风险对冲的效果！' },
      { id: 'L2-4-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L3-1',
    level: 3,
    title: '股票基础',
    description: '认识股票和市盈率',
    icon: '📈',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L3-1-1', title: '股票是什么', type: 'reading', duration: '图文', completed: false, content: '股票就是公司的所有权凭证，买股票就是买公司的一部分！' },
      { id: 'L3-1-2', title: '股价由什么决定', type: 'reading', duration: '图文', completed: false, content: '股价长期看公司基本面，短期看市场情绪和资金流动！' },
      { id: 'L3-1-3', title: '市盈率怎么看', type: 'reading', duration: '图文', completed: false, content: '市盈率=股价/每股收益，反映了你为每一块钱利润愿意付出多少钱！' },
      { id: 'L3-1-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L3-2',
    level: 3,
    title: 'K线图入门',
    description: '看懂开盘收盘最高最低',
    icon: '🕯️',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L3-2-1', title: '认识K线', type: 'reading', duration: '图文', completed: false, content: 'K线由实体和影线组成，红色通常代表上涨，绿色代表下跌！' },
      { id: 'L3-2-2', title: '单根K线解读', type: 'reading', duration: '图文', completed: false, content: '大阳线、大阴线、十字星、上下影线...不同形态有不同含义！' },
      { id: 'L3-2-3', title: 'K线组合看趋势', type: 'reading', duration: '图文', completed: false, content: '红三兵、三只乌鸦、吞没形态...组合形态能给出更明确的信号！' },
      { id: 'L3-2-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L3-3',
    level: 3,
    title: '技术指标初学',
    description: '了解MA、MACD、RSI基础',
    icon: '📊',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L3-3-1', title: '移动平均线MA', type: 'reading', duration: '图文', completed: false, content: 'MA平滑了价格波动，MA5是短期均线，MA20是中期均线，金叉死叉很重要！' },
      { id: 'L3-3-2', title: 'MACD指标', type: 'reading', duration: '图文', completed: false, content: 'MACD由DIF、DEA和柱状线组成，能帮你判断趋势和动量！' },
      { id: 'L3-3-3', title: 'RSI相对强弱指标', type: 'reading', duration: '图文', completed: false, content: 'RSI在0-100之间波动，超过70算超买，低于30算超卖！' },
      { id: 'L3-3-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L3-4',
    level: 3,
    title: '基本面分析',
    description: '学习财务报表和行业分析',
    icon: '📋',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L3-4-1', title: '三大财务报表', type: 'reading', duration: '图文', completed: false, content: '资产负债表看家底，利润表看赚钱能力，现金流量表看钱从哪来到哪去！' },
      { id: 'L3-4-2', title: '关键财务指标', type: 'reading', duration: '图文', completed: false, content: 'ROE、毛利率、净利率、负债率...这些指标能帮你判断公司好坏！' },
      { id: 'L3-4-3', title: '行业分析视角', type: 'reading', duration: '图文', completed: false, content: '看行业空间、竞争格局、政策导向，选择好赛道里的好公司！' },
      { id: 'L3-4-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L4-1',
    level: 4,
    title: '期权基础',
    description: '了解认购认沽和权利金',
    icon: '🎯',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L4-1-1', title: '期权是什么', type: 'reading', duration: '图文', completed: false, content: '期权是一种选择权，买方支付权利金获得在未来某个时间买入或卖出标的资产的权利！' },
      { id: 'L4-1-2', title: '认购期权vs认沽期权', type: 'reading', duration: '图文', completed: false, content: '认购期权（看涨）：有权买入标的；认沽期权（看跌）：有权卖出标的！' },
      { id: 'L4-1-3', title: '期权的价值组成', type: 'reading', duration: '图文', completed: false, content: '期权价值=内在价值+时间价值，内在价值是立即行权的收益！' },
      { id: 'L4-1-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L4-2',
    level: 4,
    title: '期货入门',
    description: '理解保证金和对冲机制',
    icon: '⚡',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L4-2-1', title: '期货是什么', type: 'reading', duration: '图文', completed: false, content: '期货是标准化合约，约定未来某个时间以约定价格买卖标的资产！' },
      { id: 'L4-2-2', title: '保证金交易', type: 'reading', duration: '图文', completed: false, content: '期货只需缴纳保证金，杠杆效应放大收益也放大风险！' },
      { id: 'L4-2-3', title: '对冲与投机', type: 'reading', duration: '图文', completed: false, content: '对冲：用期货降低风险；投机：用期货博取价差收益！' },
      { id: 'L4-2-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L4-3',
    level: 4,
    title: '量化投资概述',
    description: '了解什么是量化和策略基础',
    icon: '🔬',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L4-3-1', title: '什么是量化投资', type: 'reading', duration: '图文', completed: false, content: '量化投资利用数学模型和数据驱动进行投资决策，减少情绪影响！' },
      { id: 'L4-3-2', title: '量化策略的核心', type: 'reading', duration: '图文', completed: false, content: '量化策略的核心是：信号生成、仓位管理、风险控制！' },
      { id: 'L4-3-3', title: '回测的重要性', type: 'reading', duration: '图文', completed: false, content: '回测是用历史数据验证策略有效性的过程，是量化投资的关键步骤！' },
      { id: 'L4-3-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L5-1',
    level: 5,
    title: '策略编写入门',
    description: '学习伪代码和逻辑结构',
    icon: '✏️',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L5-1-1', title: '策略逻辑的基本结构', type: 'reading', duration: '图文', completed: false, content: '策略通常包含：信号生成、入场规则、出场规则、止损止盈！' },
      { id: 'L5-1-2', title: '技术指标的应用', type: 'reading', duration: '图文', completed: false, content: '利用MA、MACD、RSI等技术指标构建买卖信号！' },
      { id: 'L5-1-3', title: '策略代码示例', type: 'reading', duration: '图文', completed: false, content: '学习编写简单的均线交叉策略代码！' },
      { id: 'L5-1-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L5-2',
    level: 5,
    title: '回测与优化',
    description: '学习参数优化和敏感性分析',
    icon: '📈',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L5-2-1', title: '回测流程详解', type: 'reading', duration: '图文', completed: false, content: '回测流程：数据准备、策略执行、绩效评估、结果分析！' },
      { id: 'L5-2-2', title: '关键绩效指标', type: 'reading', duration: '图文', completed: false, content: '回测报告关注：总收益、年化收益、夏普比率、最大回撤、胜率！' },
      { id: 'L5-2-3', title: '参数优化方法', type: 'reading', duration: '图文', completed: false, content: '网格搜索：在参数范围内系统测试，找到最优组合！' },
      { id: 'L5-2-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L5-3',
    level: 5,
    title: '风险管理',
    description: '学习仓位管理和止损策略',
    icon: '🛡️',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L5-3-1', title: '仓位管理策略', type: 'reading', duration: '图文', completed: false, content: '固定比例、凯利公式、等权重...不同的仓位管理方法！' },
      { id: 'L5-3-2', title: '止损与止盈', type: 'reading', duration: '图文', completed: false, content: '止损：控制单笔亏损；止盈：保护已有利润！' },
      { id: 'L5-3-3', title: '风险分散原则', type: 'reading', duration: '图文', completed: false, content: '不把鸡蛋放一个篮子，多策略、多品种、多周期！' },
      { id: 'L5-3-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
  {
    id: 'L5-4',
    level: 5,
    title: '策略组合',
    description: '学习多策略协同和组合优化',
    icon: '🎨',
    unlocked: false,
    completed: false,
    contentType: 'text',
    lessons: [
      { id: 'L5-4-1', title: '策略组合的优势', type: 'reading', duration: '图文', completed: false, content: '策略组合可以降低单一策略风险，提高整体稳健性！' },
      { id: 'L5-4-2', title: '策略相关性分析', type: 'reading', duration: '图文', completed: false, content: '选择相关性低的策略组合，获得更好的分散效果！' },
      { id: 'L5-4-3', title: '资金分配方法', type: 'reading', duration: '图文', completed: false, content: '等权分配、按夏普比率分配、按风险分配...不同的资金分配策略！' },
      { id: 'L5-4-4', title: '章节测验', type: 'quiz', duration: '5题', completed: false },
    ],
  },
]

const QUIZZES: Record<string, { question: string; options: string[]; correct: number; explanation: string }[]> = {
  'L1-1': [
    {
      question: '什么是复利？',
      options: ['只算本金利息', '利滚利，钱生钱', '固定利息', '每年利息减半'],
      correct: 1,
      explanation: '复利就是利息再产生利息，让你的钱像雪球一样越滚越大！'
    },
    {
      question: '年化收益10%，投资100元，10年后大约有多少？',
      options: ['200元', '259元', '300元', '150元'],
      correct: 1,
      explanation: '100 × (1 + 0.1)¹⁰ ≈ 259元，复利的魔力显现！'
    },
    {
      question: '复利的关键是什么？',
      options: ['本金多', '利率高', '时间长', '运气好'],
      correct: 2,
      explanation: '时间是复利最好的朋友，越早开始，效果越明显！'
    },
    {
      question: '单利和复利的区别是？',
      options: ['单利利息更高', '复利利息更高', '没区别', '单利计算复杂'],
      correct: 1,
      explanation: '长期来看，复利的收益会超过单利！'
    },
    {
      question: '如何发挥复利的效果？',
      options: ['短期投机', '坚持长期投资', '频繁买卖', '只存银行'],
      correct: 1,
      explanation: '坚持长期投资，让复利为你打工！'
    }
  ],
  'L1-2': [
    {
      question: '货币基金的特点是？',
      options: ['高风险高收益', '流动性好，收益稳定', '只能存一年', '不能随时取出'],
      correct: 1,
      explanation: '货币基金流动性好，风险低，适合管理零花钱！'
    },
    {
      question: '货币基金的收益通常是？',
      options: ['20-30%', '2-3%', '50%以上', '保证亏损'],
      correct: 1,
      explanation: '货币基金收益稳定，通常在2-3%左右。'
    },
    {
      question: 'T+0是什么意思？',
      options: ['今天买明天卖', '当天就可以赎回', '一年后才能取', '只能存定期'],
      correct: 1,
      explanation: 'T+0就是当天就可以赎回，流动性很好！'
    },
    {
      question: '货币基金的风险水平是？',
      options: ['高风险', '低风险', '中等风险', '零风险'],
      correct: 1,
      explanation: '货币基金风险很低，适合保守型投资者！'
    },
    {
      question: '货币基金适合用来？',
      options: ['存零花钱', '赚大钱', '买房首付', '养老钱'],
      correct: 0,
      explanation: '货币基金适合管理短期闲置资金！'
    }
  ],
  'L1-3': [
    {
      question: '债券的本质是什么？',
      options: ['股票', '借钱的凭证', '商品', '房产'],
      correct: 1,
      explanation: '债券就是你把钱借给别人，别人给你借条和利息！'
    },
    {
      question: '债券的收益来源是？',
      options: ['股息分红', '利息', '价格上涨', '租金收入'],
      correct: 1,
      explanation: '债券主要收益来自定期支付的利息。'
    },
    {
      question: '债券的票面利率是？',
      options: ['随机确定的', '约定的利息率', '股票利率', '银行存款利率'],
      correct: 1,
      explanation: '票面利率是发行时约定的利息率。'
    },
    {
      question: '市场利率上升时，债券价格通常会？',
      options: ['上涨', '下跌', '不变', '翻倍'],
      correct: 1,
      explanation: '市场利率上升，原有债券吸引力下降，价格下跌。'
    },
    {
      question: '国债的信用风险通常比企业债？',
      options: ['更高', '更低', '一样', '无法比较'],
      correct: 1,
      explanation: '国债由国家信用担保，信用风险通常低于企业债！'
    }
  ],
  'L1-4': [
    {
      question: '银行理财产品的期限通常是？',
      options: ['无期限', '1个月到1年', '只能存5年', '必须存到退休'],
      correct: 1,
      explanation: '银行理财有固定期限，从1个月到1年都有。'
    },
    {
      question: '预期收益率是什么意思？',
      options: ['保证能拿到', '预计可能的收益', '固定利息', '最低收益'],
      correct: 1,
      explanation: '预期收益是预计可能的收益，不是保证的。'
    },
    {
      question: '不同理财产品的风险？',
      options: ['都一样', '差别很大', '都保本', '都不保本'],
      correct: 1,
      explanation: '不同理财产品风险差别很大，要仔细看说明书！'
    },
    {
      question: '保本型理财产品保证？',
      options: ['不保证', '本金安全', '收益翻倍', '本金损失'],
      correct: 1,
      explanation: '保本型理财产品保证本金安全，收益可能有浮动。'
    },
    {
      question: '购买理财产品时要注意？',
      options: ['只看收益', '收益、风险、期限都要看', '随便买', '只买贵的'],
      correct: 1,
      explanation: '购买前要综合考虑收益、风险、期限等因素！'
    }
  ],
  'L2-1': [
    {
      question: '股票型基金主要投资于？',
      options: ['债券', '股票', '货币', '房产'],
      correct: 1,
      explanation: '股票型基金主要投资于股票市场！'
    },
    {
      question: '债券型基金的风险通常是？',
      options: ['高风险', '中等风险', '低风险', '零风险'],
      correct: 1,
      explanation: '债券型基金风险中等，比股票型基金低。'
    },
    {
      question: '混合型基金是？',
      options: ['只投股票', '只投债券', '既投股票又投债券', '只投货币'],
      correct: 2,
      explanation: '混合型基金灵活配置股票和债券。'
    },
    {
      question: '哪类基金风险最高？',
      options: ['货币型', '债券型', '股票型', '混合型'],
      correct: 2,
      explanation: '股票型基金风险最高，但潜在收益也最高！'
    },
    {
      question: '选择基金时要考虑？',
      options: ['只看收益', '你的风险承受能力', '听朋友推荐', '随便买'],
      correct: 1,
      explanation: '选择基金要结合自己的风险承受能力！'
    }
  ],
  'L2-2': [
    {
      question: '定投是什么？',
      options: ['一次性投资', '定期定额投资', '天天炒股', '只存银行'],
      correct: 1,
      explanation: '定投就是定期定额投资，省心省力！'
    },
    {
      question: '定投在下跌时？',
      options: ['亏钱就卖', '买入更多份额', '停止定投', '恐慌性抛售'],
      correct: 1,
      explanation: '市场下跌时定投可以买入更多份额，摊低成本！'
    },
    {
      question: '微笑曲线是什么？',
      options: ['基金走势图', '定投先亏后赚的过程', '笑脸表情', '股票K线图'],
      correct: 1,
      explanation: '微笑曲线描述了定投从亏损到盈利的过程！'
    },
    {
      question: '定投的优点是？',
      options: ['保证赚钱', '省时间，不用择时', '无风险', '手续费高'],
      correct: 1,
      explanation: '定投省时间，不用每天盯盘择时！'
    },
    {
      question: '定投最重要的是什么？',
      options: ['选对时机', '坚持长期投资', '天天调整', '只投一个月'],
      correct: 1,
      explanation: '定投最重要的是坚持，长期坚持才有效果！'
    }
  ],
  'L2-3': [
    {
      question: '夏普比率衡量什么？',
      options: ['绝对收益', '风险调整后收益', '最大回撤', '波动率'],
      correct: 1,
      explanation: '夏普比率衡量每承担一单位风险能获得多少超额收益！'
    },
    {
      question: '夏普比率越高说明？',
      options: ['风险越大', '风险调整后收益越好', '收益越高', '波动越大'],
      correct: 1,
      explanation: '夏普比率越高，说明承担同样风险能获得更高收益！'
    },
    {
      question: '最大回撤是什么？',
      options: ['最大涨幅', '历史最大亏损幅度', '平均收益', '波动率'],
      correct: 1,
      explanation: '最大回撤是从历史最高点跌到最低点的幅度！'
    },
    {
      question: '其他条件相同，选择哪种？',
      options: ['夏普比率低的', '最大回撤大的', '夏普比率高，最大回撤小的', '随便选'],
      correct: 2,
      explanation: '优选夏普比率高且最大回撤小的基金！'
    },
    {
      question: '换手率高说明？',
      options: ['基金经理很懒', '交易频繁，手续费可能高', '收益一定高', '风险一定低'],
      correct: 1,
      explanation: '换手率高意味着交易频繁，可能产生较高的手续费成本！'
    }
  ],
  'L2-4': [
    {
      question: '分散投资的意思是？',
      options: ['只买一只股票', '把钱分散投资在不同资产上', '全部存银行', '只买债券'],
      correct: 1,
      explanation: '分散投资就是不要把鸡蛋放在一个篮子里！'
    },
    {
      question: '分散投资的主要目的是？',
      options: ['获取最高收益', '降低风险', '节省时间', '不用学习'],
      correct: 1,
      explanation: '分散投资的主要目的是降低单一资产带来的风险！'
    },
    {
      question: '资产配置不需要考虑？',
      options: ['风险承受能力', '投资期限', '朋友的推荐', '理财目标'],
      correct: 2,
      explanation: '资产配置要根据自己的实际情况，不要盲目跟风！'
    },
    {
      question: '股票和债券通常相关性？',
      options: ['完全正相关', '较低，可以分散风险', '完全负相关', '不确定'],
      correct: 1,
      explanation: '股票和债券相关性较低，搭配投资可以起到分散风险的效果！'
    },
    {
      question: '以下哪种组合最符合分散投资？',
      options: ['只买一只股票', '股票+债券+货币基金', '全部存银行', '只买同行业股票'],
      correct: 1,
      explanation: '多种不同类型资产的组合才能有效分散风险！'
    }
  ],
  'L3-1': [
    {
      question: '股票是什么？',
      options: ['欠条', '公司所有权凭证', '银行存款', '债券'],
      correct: 1,
      explanation: '股票代表对公司的所有权，买股票就是买公司的一部分！'
    },
    {
      question: '股价长期看由什么决定？',
      options: ['庄家操作', '公司基本面', '运气', '新闻'],
      correct: 1,
      explanation: '股价长期看公司基本面，短期看市场情绪！'
    },
    {
      question: '市盈率PE的计算公式是？',
      options: ['股价×每股收益', '股价/每股收益', '每股收益/股价', '股价+每股收益'],
      correct: 1,
      explanation: '市盈率=股价/每股收益，反映为每一块钱利润愿意付出多少钱！'
    },
    {
      question: '一般来说，PE越高说明？',
      options: ['越便宜', '估值可能越高', '风险越低', '收益越确定'],
      correct: 1,
      explanation: 'PE越高说明投资者愿意为每一块钱利润付出更多，估值可能偏高！'
    },
    {
      question: '买股票本质是买？',
      options: ['赌博', '公司的未来', '彩票', '投机'],
      correct: 1,
      explanation: '买股票本质是买公司的未来，要关注公司长期价值！'
    }
  ],
  'L3-2': [
    {
      question: 'K线的实体部分表示？',
      options: ['最高价', '开盘价和收盘价', '最低价', '成交量'],
      correct: 1,
      explanation: 'K线实体表示开盘价和收盘价，影线表示最高价和最低价！'
    },
    {
      question: '大阳线通常表示？',
      options: ['下跌', '上涨力量强', '横盘', '不确定'],
      correct: 1,
      explanation: '大阳线收盘价远高于开盘价，通常表示上涨力量较强！'
    },
    {
      question: '十字星表示？',
      options: ['大涨', '大跌', '多空分歧大', '成交量大'],
      correct: 2,
      explanation: '十字星开盘价和收盘价接近，说明多空双方分歧较大！'
    },
    {
      question: '红三兵形态通常是？',
      options: ['看跌信号', '看涨信号', '横盘信号', '成交量信号'],
      correct: 1,
      explanation: '红三兵是连续三根上涨阳线，通常是看涨信号！'
    },
    {
      question: '看K线时需要关注？',
      options: ['只看单根K线', '结合K线组合和趋势', '只看颜色', '只看影线'],
      correct: 1,
      explanation: '看K线要结合K线组合、趋势和其他指标综合判断！'
    }
  ],
  'L3-3': [
    {
      question: 'MA是什么？',
      options: ['随机指标', '移动平均线', '相对强弱指标', 'MACD'],
      correct: 1,
      explanation: 'MA是Moving Average，移动平均线的意思！'
    },
    {
      question: 'MA5和MA20，哪个是短期均线？',
      options: ['MA5', 'MA20', '都是长期', '都是短期'],
      correct: 0,
      explanation: 'MA5是5日移动平均线，属于短期均线！'
    },
    {
      question: '金叉通常指？',
      options: ['短期均线上穿长期均线', '短期均线下穿长期均线', '价格上涨', '价格下跌'],
      correct: 0,
      explanation: '金叉是短期均线上穿长期均线，通常被视为看涨信号！'
    },
    {
      question: 'RSI超过70通常认为？',
      options: ['超卖', '超买', '正常', '看不清楚'],
      correct: 1,
      explanation: 'RSI超过70通常认为是超买状态，可能有回调风险！'
    },
    {
      question: 'MACD由什么组成？',
      options: ['只有一条线', 'DIF、DEA和柱状线', '只有柱状线', '只有DIF'],
      correct: 1,
      explanation: 'MACD由DIF线、DEA线和柱状线组成！'
    }
  ],
  'L3-4': [
    {
      question: '哪张报表看公司家底？',
      options: ['利润表', '资产负债表', '现金流量表', '都不是'],
      correct: 1,
      explanation: '资产负债表看公司的资产、负债和所有者权益，了解家底！'
    },
    {
      question: '哪张报表看赚钱能力？',
      options: ['资产负债表', '利润表', '现金流量表', '都不是'],
      correct: 1,
      explanation: '利润表看公司的营收、利润情况，了解赚钱能力！'
    },
    {
      question: 'ROE是什么？',
      options: ['市盈率', '净资产收益率', '毛利率', '负债率'],
      correct: 1,
      explanation: 'ROE是Return on Equity，净资产收益率，衡量股东权益的回报率！'
    },
    {
      question: '行业分析不需要看？',
      options: ['行业空间', '竞争格局', '政策导向', '隔壁公司'],
      correct: 3,
      explanation: '行业分析要看空间、竞争格局、政策，不是看某一家公司！'
    },
    {
      question: '买股票时应？',
      options: ['只看技术面', '只看基本面', '结合技术面和基本面', '只听消息'],
      correct: 2,
      explanation: '投资要结合技术面和基本面，全面分析！'
    }
  ],
  'L4-1': [
    {
      question: '期权是什么？',
      options: ['股票', '选择权合约', '债券', '商品'],
      correct: 1,
      explanation: '期权是一种选择权，买方支付权利金获得在未来某个时间买入或卖出标的资产的权利！'
    },
    {
      question: '认购期权是？',
      options: ['有权买入', '有权卖出', '必须买入', '必须卖出'],
      correct: 0,
      explanation: '认购期权（看涨）：有权在未来以约定价格买入标的资产！'
    },
    {
      question: '期权价值由什么组成？',
      options: ['只有内在价值', '内在价值+时间价值', '只有时间价值', '随机值'],
      correct: 1,
      explanation: '期权价值=内在价值+时间价值，内在价值是立即行权的收益！'
    },
    {
      question: '时间价值随时间？',
      options: ['增加', '衰减', '不变', '先增后减'],
      correct: 1,
      explanation: '时间价值随时间衰减，越接近到期日，时间价值越小！'
    },
    {
      question: '期权买方的最大损失是？',
      options: ['无限', '权利金', '标的资产价值', '保证金'],
      correct: 1,
      explanation: '期权买方最大损失是支付的权利金，收益理论上无限！'
    }
  ],
  'L4-2': [
    {
      question: '期货是什么？',
      options: ['股票', '标准化合约', '债券', '商品'],
      correct: 1,
      explanation: '期货是标准化合约，约定未来某个时间以约定价格买卖标的资产！'
    },
    {
      question: '保证金交易的特点是？',
      options: ['无杠杆', '放大收益放大风险', '只放大收益', '只放大风险'],
      correct: 1,
      explanation: '期货只需缴纳保证金，杠杆效应放大收益也放大风险！'
    },
    {
      question: '对冲的目的是？',
      options: ['投机', '降低风险', '赚取差价', '增加收益'],
      correct: 1,
      explanation: '对冲：用期货降低现有资产的价格风险！'
    },
    {
      question: '期货合约到期时？',
      options: ['自动展期', '实物交割或现金结算', '自动取消', '可以无限期持有'],
      correct: 1,
      explanation: '期货合约到期时需要进行实物交割或现金结算！'
    },
    {
      question: '期货投机者追求的是？',
      options: ['降低风险', '博取价差收益', '持有实物', '稳定收益'],
      correct: 1,
      explanation: '投机者：用期货博取价格变动的价差收益，承担风险！'
    }
  ],
  'L4-3': [
    {
      question: '量化投资利用什么决策？',
      options: ['主观判断', '数学模型和数据', '消息面分析', '技术面分析'],
      correct: 1,
      explanation: '量化投资利用数学模型和数据驱动进行投资决策，减少情绪影响！'
    },
    {
      question: '量化策略的核心不包括？',
      options: ['信号生成', '情绪控制', '仓位管理', '风险控制'],
      correct: 1,
      explanation: '量化策略的核心是：信号生成、仓位管理、风险控制！'
    },
    {
      question: '回测是用什么验证策略？',
      options: ['未来数据', '历史数据', '实时数据', '模拟数据'],
      correct: 1,
      explanation: '回测是用历史数据验证策略有效性的过程！'
    },
    {
      question: '量化投资的优势不包括？',
      options: ['纪律性强', '速度快', '无需学习', '可回测'],
      correct: 2,
      explanation: '量化投资有纪律性强、速度快、可回测，但仍需学习！'
    },
    {
      question: '过度拟合指的是？',
      options: ['策略太简单', '策略过度适应历史数据', '策略太复杂', '策略收益太高'],
      correct: 1,
      explanation: '过度拟合指策略过度适应历史数据，在实盘表现不佳！'
    }
  ],
  'L5-1': [
    {
      question: '策略逻辑通常不包含？',
      options: ['信号生成', '情绪管理', '入场规则', '止损止盈'],
      correct: 1,
      explanation: '策略通常包含：信号生成、入场规则、出场规则、止损止盈！'
    },
    {
      question: '金叉通常指什么信号？',
      options: ['卖出', '买入', '持有', '观望'],
      correct: 1,
      explanation: '金叉通常是买入信号，死叉通常是卖出信号！'
    },
    {
      question: '策略代码的核心是？',
      options: ['越复杂越好', '清晰的买卖逻辑', '无需测试', '只看一个指标'],
      correct: 1,
      explanation: '策略代码的核心是清晰的买卖逻辑，简单有效！'
    },
    {
      question: '策略测试的第一步是？',
      options: ['直接实盘', '回测验证', '优化参数', '增加指标'],
      correct: 1,
      explanation: '策略测试的第一步是用历史数据回测验证！'
    },
    {
      question: '好的策略应该是？',
      options: ['收益最高的', '简单且逻辑清晰', '指标最多的', '永不亏损的'],
      correct: 1,
      explanation: '好的策略应该是简单且逻辑清晰，可理解可验证！'
    }
  ],
  'L5-2': [
    {
      question: '回测的第一步是？',
      options: ['直接优化', '数据准备', '结果分析', '绩效评估'],
      correct: 1,
      explanation: '回测流程：数据准备、策略执行、绩效评估、结果分析！'
    },
    {
      question: '回测关键指标不包括？',
      options: ['总收益', '最大回撤', '夏普比率', '朋友评价'],
      correct: 3,
      explanation: '回测报告关注：总收益、年化收益、夏普比率、最大回撤、胜率！'
    },
    {
      question: '网格搜索用于？',
      options: ['随机搜索', '系统测试参数组合', '凭感觉选参数', '只优化一个参数'],
      correct: 1,
      explanation: '网格搜索：在参数范围内系统测试，找到最优组合！'
    },
    {
      question: '参数优化时要注意？',
      options: ['追求最高收益', '避免过度拟合', '只看回测', '忽略样本外'],
      correct: 1,
      explanation: '参数优化要避免过度拟合，关注样本外表现！'
    },
    {
      question: '夏普比率衡量什么？',
      options: ['绝对收益', '风险调整后收益', '最大回撤', '交易次数'],
      correct: 1,
      explanation: '夏普比率衡量每承担一单位风险能获得多少超额收益！'
    }
  ],
  'L5-3': [
    {
      question: '常见的仓位管理不包括？',
      options: ['固定比例', '凯利公式', '等权重', '全仓all in'],
      correct: 3,
      explanation: '常见的仓位管理：固定比例、凯利公式、等权重等！'
    },
    {
      question: '止损的目的是？',
      options: ['赚更多', '控制单笔亏损', '增加收益', '减少交易'],
      correct: 1,
      explanation: '止损：控制单笔亏损，保护本金！'
    },
    {
      question: '止盈的目的是？',
      options: ['赚更多', '保护已有利润', '增加交易', '减少风险'],
      correct: 1,
      explanation: '止盈：保护已有利润，避免利润回吐！'
    },
    {
      question: '风险分散原则不包括？',
      options: ['多策略', '多品种', '多周期', 'all in一个'],
      correct: 3,
      explanation: '风险分散：不把鸡蛋放一个篮子，多策略、多品种、多周期！'
    },
    {
      question: '凯利公式用于？',
      options: ['计算最优仓位', '预测价格', '选择股票', '计算手续费'],
      correct: 0,
      explanation: '凯利公式用于计算最优仓位比例！'
    }
  ],
  'L5-4': [
    {
      question: '策略组合的主要优势是？',
      options: ['提高收益', '降低风险', '简化操作', '减少手续费'],
      correct: 1,
      explanation: '策略组合可以降低单一策略风险，提高整体稳健性！'
    },
    {
      question: '选择策略组合时应选？',
      options: ['完全正相关', '相关性低', '完全负相关', '随便选'],
      correct: 1,
      explanation: '选择相关性低的策略组合，获得更好的分散效果！'
    },
    {
      question: '资金分配方法不包括？',
      options: ['等权分配', '按夏普比率', '按风险', '凭感觉'],
      correct: 3,
      explanation: '资金分配方法：等权分配、按夏普比率分配、按风险分配！'
    },
    {
      question: '策略再平衡的目的是？',
      options: ['追涨杀跌', '保持目标权重', '增加交易', '减少收益'],
      correct: 1,
      explanation: '策略再平衡是保持目标权重，避免单一策略权重偏离！'
    },
    {
      question: '好的策略组合应该是？',
      options: ['全是高收益', '风险收益平衡', '只一种策略', '不用管相关性'],
      correct: 1,
      explanation: '好的策略组合应该是风险收益平衡，分散化！'
    }
  ],
}

function Learning() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [quizCurrentQuestion, setQuizCurrentQuestion] = useState(0)
  const { addExperience, addGold, completeCourse, hasCompletedCourse } = useUserStore()

  // 检查Level 1是否全部完成
  const isLevel1Completed = ['L1-1', 'L1-2', 'L1-3', 'L1-4'].every(id => hasCompletedCourse(id))
  // 检查Level 2是否全部完成
  const isLevel2Completed = ['L2-1', 'L2-2', 'L2-3', 'L2-4'].every(id => hasCompletedCourse(id))
  // 检查Level 3是否全部完成
  const isLevel3Completed = ['L3-1', 'L3-2', 'L3-3', 'L3-4'].every(id => hasCompletedCourse(id))
  // 检查Level 4是否全部完成
  const isLevel4Completed = ['L4-1', 'L4-2', 'L4-3'].every(id => hasCompletedCourse(id))

  // 动态生成课程列表，根据完成情况更新解锁状态
  const getCourses = () => {
    return COURSES.map(course => {
      let isUnlocked = course.unlocked
      // Level 2 课程在 Level 1 完成后解锁
      if (course.level === 2) {
        isUnlocked = isLevel1Completed
      }
      // Level 3 课程在 Level 2 完成后解锁
      if (course.level === 3) {
        isUnlocked = isLevel1Completed && isLevel2Completed
      }
      // Level 4 课程在 Level 3 完成后解锁
      if (course.level === 4) {
        isUnlocked = isLevel1Completed && isLevel2Completed && isLevel3Completed
      }
      // Level 5 课程在 Level 4 完成后解锁
      if (course.level === 5) {
        isUnlocked = isLevel1Completed && isLevel2Completed && isLevel3Completed && isLevel4Completed
      }
      return {
        ...course,
        unlocked: isUnlocked,
        completed: hasCompletedCourse(course.id)
      }
    })
  }

  useEffect(() => {
    if (selectedCourse) {
      setQuizAnswers([])
      setShowQuizResult(false)
      setQuizCurrentQuestion(0)
      setCurrentLesson(0)
    }
  }, [selectedCourse?.id])

  const handleLessonComplete = () => {
    if (!selectedCourse) return

    const updatedLessons = [...selectedCourse.lessons]
    updatedLessons[currentLesson].completed = true
    
    const allCompleted = updatedLessons.every(l => l.completed)
    
    setSelectedCourse(prev => {
      if (!prev) return null
      return {
        ...prev,
        lessons: updatedLessons,
        completed: allCompleted
      }
    })
    
    if (currentLesson < updatedLessons.length - 1) {
      setCurrentLesson(currentLesson + 1)
      setShowQuizResult(false)
      setQuizAnswers([])
      setQuizCurrentQuestion(0)
    } else {
      setCurrentLesson(0)
      setSelectedCourse(null)
    }
  }

  const handleQuizAnswer = (optionIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[quizCurrentQuestion] = optionIndex
    setQuizAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (!selectedCourse) return
    const quiz = QUIZZES[selectedCourse.id] || []
    
    if (quizCurrentQuestion < quiz.length - 1) {
      setQuizCurrentQuestion(quizCurrentQuestion + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (quizCurrentQuestion > 0) {
      setQuizCurrentQuestion(quizCurrentQuestion - 1)
    }
  }

  const handleQuizSubmit = () => {
    setShowQuizResult(true)
  }

  const handleGetReward = () => {
    if (!selectedCourse) return
    
    if (!hasCompletedCourse(selectedCourse.id)) {
      const success = completeCourse(selectedCourse.id)
      if (success) {
        addExperience(50)
        addGold(100)
      }
    }
    handleLessonComplete()
  }

  const calculateScore = () => {
    if (!selectedCourse) return { correct: 0, total: 0 }
    const quiz = QUIZZES[selectedCourse.id] || []
    let correct = 0
    quizAnswers.forEach((answer, index) => {
      if (answer === quiz[index].correct) {
        correct++
      }
    })
    return { correct, total: quiz.length }
  }

  const renderLessonContent = () => {
    if (!selectedCourse) return null
    const lesson = selectedCourse.lessons[currentLesson]
    const quiz = QUIZZES[selectedCourse.id] || []

    if (lesson.type === 'quiz') {
      if (showQuizResult) {
        return (
          <div className="quiz-result-page">
            <div className="result-header">
              <div className="result-icon">
                {calculateScore().correct >= quiz.length * 0.8 ? '🎉' : '📚'}
              </div>
              <h2>{calculateScore().correct >= quiz.length * 0.8 ? '恭喜通过！' : '继续加油！'}</h2>
              <p className="result-score">
                正确率: {calculateScore().correct}/{calculateScore().total} ({Math.round(calculateScore().correct / calculateScore().total * 100)}%)
              </p>
            </div>

            <div className="answers-review-section">
              {quiz.map((q, index) => {
                const userAnswer = quizAnswers[index]
                const isCorrect = userAnswer === q.correct
                return (
                  <div key={index} className={`answer-item ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="question-header">
                      <span className="question-number">第{index + 1}题</span>
                      <span className="answer-status">{isCorrect ? '✓ 正确' : '✗ 错误'}</span>
                    </div>
                    <p className="question-text">{q.question}</p>
                    <div className="options-review">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`option-review ${
                            optIndex === q.correct ? 'correct-answer' :
                            optIndex === userAnswer && !isCorrect ? 'user-wrong' : ''
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {opt}
                        </div>
                      ))}
                    </div>
                    <div className="explanation-box">
                      <strong>解析：</strong> {q.explanation}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="result-actions">
              {calculateScore().correct >= quiz.length * 0.8 && (
                <button className="reward-button" onClick={handleGetReward}>
                  {selectedCourse && !hasCompletedCourse(selectedCourse.id) 
                    ? (selectedCourse.id === 'L5-4' 
                        ? "🎉 完成全部课程！返回课程列表" 
                        : "解锁下一课 +50经验 +100金币")
                    : "继续"}
                </button>
              )}
              <button className="retry-button" onClick={() => {
                setShowQuizResult(false)
                setQuizAnswers([])
                setQuizCurrentQuestion(0)
              }}>
                再试一次
              </button>
            </div>
          </div>
        )
      }

      const currentQ = quiz[quizCurrentQuestion]

      return (
        <div className="quiz-page">
          <div className="quiz-header">
            <h2 className="quiz-title">{lesson.title}</h2>
            <div className="quiz-progress-bar">
              <div 
                className="quiz-progress-fill"
                style={{ width: `${(quizAnswers.length / quiz.length) * 100}%` }}
              />
            </div>
            <p className="quiz-progress-text">
              问题 {quizCurrentQuestion + 1}/{quiz.length}
            </p>
          </div>

          <div className="question-card">
            <p className="question-text">{quizCurrentQuestion + 1}. {currentQ.question}</p>
            <div className="options-grid">
              {currentQ.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  className={`option-button ${quizAnswers[quizCurrentQuestion] === optIndex ? 'selected' : ''}`}
                  onClick={() => handleQuizAnswer(optIndex)}
                >
                  {String.fromCharCode(65 + optIndex)}. {option}
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              className="nav-button prev"
              onClick={handlePrevQuestion}
              disabled={quizCurrentQuestion === 0}
            >
              上一题
            </button>

            {quizCurrentQuestion < quiz.length - 1 ? (
              <button
                className="nav-button next"
                onClick={handleNextQuestion}
                disabled={quizAnswers[quizCurrentQuestion] === undefined}
              >
                下一题
              </button>
            ) : (
              <button
                className="nav-button submit"
                onClick={handleQuizSubmit}
                disabled={quizAnswers.length < quiz.length}
              >
                提交答案
              </button>
            )}
          </div>
        </div>
      )
    }

    if (selectedCourse.contentType === 'video') {
      return (
        <div className="video-lesson">
          <div className="video-placeholder">
            <div className="video-icon">🎬</div>
            <h3>{lesson.title}</h3>
            <p>动画讲解正在加载中...这是概念动画，展示核心知识点</p>
            <div className="video-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }} />
              </div>
              <span className="progress-text">播放中 {Math.floor(Math.random() * 30) + 10}秒 / {lesson.duration}</span>
            </div>
            <div className="video-controls">
              <button className="control-button">⏮</button>
              <button className="control-button play">▶️</button>
              <button className="control-button">⏭</button>
            </div>
          </div>
          <button className="complete-lesson-button" onClick={handleLessonComplete}>
            完成学习
          </button>
        </div>
      )
    }

    return (
      <div className="text-lesson">
        <div className="text-content">
          <div className="lesson-icon">📖</div>
          <h3>{lesson.title}</h3>
          <div className="lesson-text">
            <p>{lesson.content || '这里是图文讲解内容，帮助你理解核心概念...'}</p>
            <div className="knowledge-cards">
              <div className="knowledge-card">
                <div className="card-icon">💡</div>
                <p>关键知识点 1</p>
              </div>
              <div className="knowledge-card">
                <div className="card-icon">📊</div>
                <p>关键知识点 2</p>
              </div>
              <div className="knowledge-card">
                <div className="card-icon">🎯</div>
                <p>关键知识点 3</p>
              </div>
            </div>
          </div>
          <div className="upload-video-section">
            <p className="upload-hint">💡 预留视频上传入口，未来可添加视频讲解</p>
            <button className="upload-button">
              📤 上传视频（可选）
            </button>
          </div>
        </div>
        <button className="complete-lesson-button" onClick={handleLessonComplete}>
          完成学习
        </button>
      </div>
    )
  }

  return (
    <div className="learning">
      <div className="learning-header">
        <h1>📚 学习中心</h1>
        <p className="sub-title">完成课程学习，解锁更多投资功能</p>
        {!isLevel1Completed && (
          <div className="level-banner level-1-banner">
            <span className="banner-icon">🔓</span>
            <div className="banner-content">
              <strong>Level 1 进行中</strong>
              <p>完成 Level 1 全部课程后解锁 Level 2</p>
            </div>
          </div>
        )}
        {isLevel1Completed && !isLevel2Completed && (
          <div className="level-banner level-2-banner">
            <span className="banner-icon">✨</span>
            <div className="banner-content">
              <strong>🎉 Level 1 已完成！</strong>
              <p>继续完成 Level 2 课程解锁 Level 3</p>
            </div>
          </div>
        )}
        {isLevel1Completed && isLevel2Completed && !isLevel3Completed && (
          <div className="level-banner level-3-banner">
            <span className="banner-icon">📊</span>
            <div className="banner-content">
              <strong>🎉 Level 2 已完成！</strong>
              <p>继续完成 Level 3 课程解锁 Level 4</p>
            </div>
          </div>
        )}
        {isLevel1Completed && isLevel2Completed && isLevel3Completed && !isLevel4Completed && (
          <div className="level-banner level-4-banner">
            <span className="banner-icon">🎯</span>
            <div className="banner-content">
              <strong>🎉 Level 3 已完成！</strong>
              <p>继续完成 Level 4 课程解锁 Level 5</p>
            </div>
          </div>
        )}
        {isLevel1Completed && isLevel2Completed && isLevel3Completed && isLevel4Completed && (
          <div className="level-banner level-5-banner">
            <span className="banner-icon">🏆</span>
            <div className="banner-content">
              <strong>恭喜！全部解锁！</strong>
              <p>你已解锁所有 Level 1-5 课程，太棒了！</p>
            </div>
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <div className="courses-container">
          {[1, 2, 3, 4, 5].map((level) => {
            const levelCourses = getCourses().filter(c => c.level === level);
            if (levelCourses.length === 0) return null;
            return (
              <div key={level} className="level-section">
                <div className={`level-header level-${level}-header`}>
                  <span className="level-number">Level {level}</span>
                  <span className="level-desc">
                    {level === 1 ? '理财启蒙' : level === 2 ? '基金进阶' : level === 3 ? '股票基础' : level === 4 ? '衍生品入门' : '量化精通'}
                  </span>
                </div>
                <div className="courses-grid">
                  {levelCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      className={`course-card level-${course.level}-card ${!course.unlocked ? 'locked' : ''} ${course.completed ? 'completed' : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => course.unlocked && setSelectedCourse(course)}
                    >
                      <div className="course-icon">{course.icon}</div>
                      <div className="course-content-type">
                        {course.contentType === 'video' ? '🎥 视频' : '📖 图文'}
                      </div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${course.completed ? 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="progress-text">
                          {course.completed ? '已完成' : `${course.lessons.length} 课时`}
                        </span>
                      </div>
                      {!course.unlocked && <div className="lock-overlay">🔒 需要先完成前序课程</div>}
                      {course.completed && <div className="completed-badge">✓ 已完成</div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="course-detail">
          <button className="back-button" onClick={() => setSelectedCourse(null)}>
            ← 返回课程列表
          </button>
          
          <div className="course-info">
            <div className="course-icon-large">{selectedCourse.icon}</div>
            <div>
              <h2>{selectedCourse.title}</h2>
              <p>{selectedCourse.description}</p>
              <span className="course-level-tag">Level {selectedCourse.level}</span>
            </div>
          </div>

          <div className="lessons-list">
            {selectedCourse.lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`lesson-item ${
                  index === currentLesson ? 'active' : ''
                } ${lesson.completed ? 'completed' : ''}`}
                onClick={() => setCurrentLesson(index)}
              >
                <div className="lesson-status">
                  {lesson.completed ? '✓' : index === currentLesson ? '▶' : '○'}
                </div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <span className="lesson-meta">
                    {lesson.type === 'animation' ? '🎬 动画' :
                     lesson.type === 'reading' ? '📖 图文' : '❓ 测验'}
                    {' · '}{lesson.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="lesson-content-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLesson}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderLessonContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

export default Learning