import { Signal } from '../api'
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'

const ACTION_STYLE: Record<string, string> = {
  BUY: 'bg-green-600 text-white',
  SELL: 'bg-red-600 text-white',
  HOLD: 'bg-yellow-600 text-white',
  'BUY CALL': 'bg-blue-600 text-white',
  'BUY PUT': 'bg-purple-600 text-white',
  'SELL CALL': 'bg-orange-600 text-white',
  'SELL PUT': 'bg-pink-600 text-white',
}

const CONFIDENCE_STARS: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }

interface Props {
  signal: Signal
  onClick?: () => void
}

export default function SignalCard({ signal, onClick }: Props) {
  const { symbol, tech, ai, sentiment } = signal
  const action = ai?.action ?? 'HOLD'
  const confidence = ai?.confidence ?? 'LOW'
  const stars = CONFIDENCE_STARS[confidence] ?? 1

  const ScoreIcon =
    tech?.score > 0.2 ? TrendingUp : tech?.score < -0.2 ? TrendingDown : Minus
  const scoreColor =
    tech?.score > 0.2 ? 'text-green-400' : tech?.score < -0.2 ? 'text-red-400' : 'text-yellow-400'

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-lg">{symbol}</div>
          <div className="text-gray-400 text-sm">${tech?.price?.toFixed(2)}</div>
        </div>
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${ACTION_STYLE[action] ?? 'bg-gray-700 text-white'}`}>
          {action}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{confidence}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-gray-800 rounded p-2">
          <div className="text-gray-500 mb-0.5">RSI</div>
          <div className={tech?.rsi_signal === 'oversold' ? 'text-green-400' : tech?.rsi_signal === 'overbought' ? 'text-red-400' : 'text-white'}>
            {tech?.rsi?.toFixed(1)}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-gray-500 mb-0.5">BB</div>
          <div className={tech?.bb_signal === 'oversold' ? 'text-green-400' : tech?.bb_signal === 'overbought' ? 'text-red-400' : 'text-white'}>
            {tech?.bb_signal}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-gray-500 mb-0.5">Sentiment</div>
          <div className={sentiment?.signal === 'bullish' ? 'text-green-400' : sentiment?.signal === 'bearish' ? 'text-red-400' : 'text-yellow-400'}>
            {sentiment?.signal}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <ScoreIcon className={`w-4 h-4 ${scoreColor}`} />
        <span className={`text-xs font-medium ${scoreColor}`}>Score: {tech?.score}</span>
        <span className="text-gray-600 text-xs ml-auto">Vol {tech?.volume_ratio}x</span>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{ai?.reasoning}</p>

      {(ai?.entry_price || ai?.target_price) && (
        <div className="mt-2 flex gap-3 text-xs">
          {ai.entry_price && <span className="text-gray-500">Entry: <span className="text-white">${ai.entry_price}</span></span>}
          {ai.target_price && <span className="text-gray-500">Target: <span className="text-green-400">${ai.target_price}</span></span>}
          {ai.stop_loss && <span className="text-gray-500">Stop: <span className="text-red-400">${ai.stop_loss}</span></span>}
        </div>
      )}
    </div>
  )
}
