import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface TechSignals {
  symbol: string
  price: number
  rsi: number
  rsi_signal: string
  macd_bullish: boolean
  macd_crossover: boolean
  bb_signal: string
  bb_pct: number
  ma50: number | null
  ma200: number | null
  golden_cross: boolean
  volume_ratio: number
  score: number
}

export interface AIRecommendation {
  action: string
  confidence: string
  reasoning: string
  entry_price: number | null
  target_price: number | null
  stop_loss: number | null
  risk: string
  time_horizon: string
}

export interface OptionSignal {
  type: string
  action: string
  strike: number
  expiry: string
  iv: number
  delta: number
  theta: number
  ask: number
  bid: number
  spread_pct: number
  volume: number
  open_interest: number
}

export interface SentimentSignal {
  symbol: string
  sentiment_score: number
  signal: string
  article_count: number
  positive: number
  negative: number
  neutral: number
  headlines: string[]
}

export interface Signal {
  symbol: string
  tech: TechSignals
  sentiment: SentimentSignal
  options: OptionSignal[]
  fundamentals: Record<string, unknown>
  ai: AIRecommendation
}

export interface Position {
  symbol: string
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  pnl: number
  pnl_pct: number
}

export interface AccountInfo {
  equity: number
  cash: number
  buying_power: number
  total_return: number
}

export interface OHLCV {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface AppStatus {
  robinhood: boolean
  anthropic: boolean
  telegram: boolean
}

export const fetchSignals = () => api.get<Signal[]>('/signals').then(r => r.data)
export const fetchSignal = (symbol: string) => api.get<Signal>(`/signals/${symbol}`).then(r => r.data)
export const fetchPortfolio = () => api.get<Position[]>('/portfolio').then(r => r.data)
export const fetchAccount = () => api.get<AccountInfo>('/account').then(r => r.data)
export const fetchChart = (symbol: string, interval = '5minute', span = 'day') =>
  api.get<OHLCV[]>(`/chart/${symbol}`, { params: { interval, span } }).then(r => r.data)
export const fetchNews = (symbol: string) =>
  api.get<{ title: string; link: string; sentiment_label: string }[]>(`/news/${symbol}`).then(r => r.data)
export const fetchStatus = () => api.get<AppStatus>('/status').then(r => r.data)
export const triggerScan = () =>
  api.post('/scan').then(r => r.data).catch(err => {
    const msg = err?.response?.data?.detail ?? 'Scan failed'
    throw new Error(msg)
  })
