import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react'
import { fetchSignals, fetchAccount, triggerScan, Signal, AccountInfo } from '../api'
import SignalCard from '../components/SignalCard'
import SignalDetail from './SignalDetail'

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [selected, setSelected] = useState<Signal | null>(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([fetchSignals(), fetchAccount()])
      .then(([sigs, acc]) => {
        setSignals(sigs)
        setAccount(acc)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleScan = () => {
    setScanning(true)
    triggerScan().finally(() => {
      setTimeout(() => {
        load()
        setScanning(false)
      }, 5000)
    })
  }

  const highConf = signals.filter(s => s.ai?.confidence === 'HIGH' && s.ai?.action !== 'HOLD')
  const buys = signals.filter(s => ['BUY', 'BUY CALL', 'BUY PUT'].includes(s.ai?.action ?? ''))
  const sells = signals.filter(s => ['SELL', 'SELL CALL', 'SELL PUT'].includes(s.ai?.action ?? ''))

  if (selected) return <SignalDetail signal={selected} onBack={() => setSelected(null)} />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Account Summary */}
      {account && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Portfolio Value', value: `$${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-blue-400' },
            { label: 'Buying Power', value: `$${account.buying_power.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Cash', value: `$${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Activity, color: 'text-yellow-400' },
            { label: "Today's Return", value: `$${account.total_return.toFixed(2)}`, icon: AlertTriangle, color: account.total_return >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-gray-400 text-xs">{label}</span>
              </div>
              <div className={`text-xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">{signals.length} symbols tracked</span>
          <span className="text-green-400 font-medium">{buys.length} Buy signals</span>
          <span className="text-red-400 font-medium">{sells.length} Sell signals</span>
          <span className="text-yellow-400 font-medium">{highConf.length} High confidence</span>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {loading && !signals.length ? (
        <div className="text-center py-20 text-gray-500">Loading signals from Robinhood...</div>
      ) : signals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="mb-2">No signals yet.</p>
          <p className="text-sm">Click "Run Scan" to analyze your watchlist.</p>
        </div>
      ) : (
        <>
          {highConf.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wider">High Confidence Alerts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {highConf.map(s => <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />)}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">All Signals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {signals.filter(s => s.ai?.confidence !== 'HIGH' || s.ai?.action === 'HOLD').map(s => (
                <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
