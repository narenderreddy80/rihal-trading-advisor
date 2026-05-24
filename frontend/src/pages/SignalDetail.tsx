import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Signal } from '../api'
import StockChart from '../components/StockChart'
import { useEffect, useState } from 'react'
import { fetchNews } from '../api'

interface Props {
  signal: Signal
  onBack: () => void
}

const ACTION_COLOR: Record<string, string> = {
  BUY: 'text-green-400', SELL: 'text-red-400', HOLD: 'text-yellow-400',
  'BUY CALL': 'text-blue-400', 'BUY PUT': 'text-purple-400',
  'SELL CALL': 'text-orange-400', 'SELL PUT': 'text-pink-400',
}

export default function SignalDetail({ signal, onBack }: Props) {
  const { symbol, tech, ai, sentiment, options, fundamentals } = signal
  const [news, setNews] = useState<{ title: string; link: string; sentiment_label: string }[]>([])

  useEffect(() => {
    fetchNews(symbol).then(setNews)
  }, [symbol])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <div className="text-gray-400">${tech?.price?.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${ACTION_COLOR[ai?.action ?? 'HOLD'] ?? 'text-white'}`}>
            {ai?.action}
          </div>
          <div className="text-sm text-gray-400">{ai?.confidence} Confidence</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Price Chart (Today)</h3>
        <StockChart symbol={symbol} />
      </div>

      {/* AI Recommendation */}
      <div className="bg-gray-900 border border-blue-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider">AI Analysis</h3>
        <p className="text-gray-200 leading-relaxed mb-4">{ai?.reasoning}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { label: 'Entry', value: ai?.entry_price ? `$${ai.entry_price}` : 'N/A', color: 'text-white' },
            { label: 'Target', value: ai?.target_price ? `$${ai.target_price}` : 'N/A', color: 'text-green-400' },
            { label: 'Stop Loss', value: ai?.stop_loss ? `$${ai.stop_loss}` : 'N/A', color: 'text-red-400' },
            { label: 'Horizon', value: ai?.time_horizon ?? 'N/A', color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">{label}</div>
              <div className={`font-medium ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-red-400">⚠️ {ai?.risk}</div>
      </div>

      {/* Technical Indicators */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Technical Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'RSI (14)', value: `${tech?.rsi?.toFixed(1)} (${tech?.rsi_signal})`, color: tech?.rsi_signal === 'oversold' ? 'text-green-400' : tech?.rsi_signal === 'overbought' ? 'text-red-400' : 'text-white' },
            { label: 'MACD', value: tech?.macd_bullish ? 'Bullish' : 'Bearish', color: tech?.macd_bullish ? 'text-green-400' : 'text-red-400' },
            { label: 'Bollinger', value: tech?.bb_signal ?? 'N/A', color: tech?.bb_signal === 'oversold' ? 'text-green-400' : tech?.bb_signal === 'overbought' ? 'text-red-400' : 'text-yellow-400' },
            { label: 'MA50', value: tech?.ma50 ? `$${tech.ma50}` : 'N/A', color: 'text-white' },
            { label: 'MA200', value: tech?.ma200 ? `$${tech.ma200}` : 'N/A', color: 'text-white' },
            { label: 'Volume', value: `${tech?.volume_ratio}x avg`, color: (tech?.volume_ratio ?? 0) > 1.5 ? 'text-yellow-400' : 'text-white' },
            { label: 'Golden Cross', value: tech?.golden_cross ? 'Yes' : 'No', color: tech?.golden_cross ? 'text-green-400' : 'text-gray-500' },
            { label: 'Composite Score', value: tech?.score?.toString(), color: (tech?.score ?? 0) > 0 ? 'text-green-400' : (tech?.score ?? 0) < 0 ? 'text-red-400' : 'text-yellow-400' },
            { label: 'Sentiment', value: sentiment?.signal ?? 'N/A', color: sentiment?.signal === 'bullish' ? 'text-green-400' : sentiment?.signal === 'bearish' ? 'text-red-400' : 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-3">
              <div className="text-gray-500 text-xs mb-1">{label}</div>
              <div className={`font-medium ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Options Signals */}
      {options?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Options Signals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  {['Action', 'Type', 'Strike', 'Expiry', 'IV%', 'Delta', 'Ask', 'Volume'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {options.slice(0, 8).map((opt, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className={`py-2 pr-4 font-medium ${opt.action.includes('BUY') ? 'text-green-400' : 'text-red-400'}`}>{opt.action}</td>
                    <td className="py-2 pr-4 capitalize">{opt.type}</td>
                    <td className="py-2 pr-4">${opt.strike}</td>
                    <td className="py-2 pr-4">{opt.expiry}</td>
                    <td className="py-2 pr-4">{opt.iv}%</td>
                    <td className="py-2 pr-4">{opt.delta}</td>
                    <td className="py-2 pr-4">${opt.ask}</td>
                    <td className="py-2 pr-4">{opt.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News */}
      {news.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Recent News</h3>
          <div className="space-y-2">
            {news.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  article.sentiment_label === 'positive' ? 'bg-green-400' :
                  article.sentiment_label === 'negative' ? 'bg-red-400' : 'bg-gray-500'
                }`} />
                <span className="text-sm text-gray-300 group-hover:text-white flex-1">{article.title}</span>
                <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Fundamentals */}
      {Object.keys(fundamentals ?? {}).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Fundamentals</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(fundamentals).map(([key, val]) => (
              <div key={key} className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">{key.replace(/_/g, ' ').toUpperCase()}</div>
                <div className="text-white font-medium">
                  {val == null ? 'N/A' : typeof val === 'number' && val > 1_000_000
                    ? `$${(val / 1e9).toFixed(2)}B` : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
