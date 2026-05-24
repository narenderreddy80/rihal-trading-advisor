import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { fetchSignals, fetchAccount, fetchStatus, triggerScan, Signal, AccountInfo, AppStatus } from '../api'
import SignalCard from '../components/SignalCard'
import SignalDetail from './SignalDetail'

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null)
  const [selected, setSelected] = useState<Signal | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetchSignals(),
      fetchAccount().catch(() => null),
      fetchStatus(),
    ])
      .then(([sigs, acc, st]) => {
        setSignals(sigs)
        setAccount(acc)
        setAppStatus(st)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleScan = () => {
    setScanError(null)
    setScanning(true)
    triggerScan()
      .then(() => {
        setTimeout(() => {
          load()
          setScanning(false)
        }, 5000)
      })
      .catch((err: Error) => {
        setScanError(err.message)
        setScanning(false)
      })
  }

  const highConf = signals.filter(s => s.ai?.confidence === 'HIGH' && s.ai?.action !== 'HOLD')
  const buys = signals.filter(s => ['BUY', 'BUY CALL', 'BUY PUT'].includes(s.ai?.action ?? ''))
  const sells = signals.filter(s => ['SELL', 'SELL CALL', 'SELL PUT'].includes(s.ai?.action ?? ''))

  if (selected) return <SignalDetail signal={selected} onBack={() => setSelected(null)} />

  const notConfigured = appStatus && !appStatus.robinhood

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Setup Banner — shown when .env credentials are missing */}
      {notConfigured && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-300 mb-2">Setup Required — Robinhood credentials not configured</div>
              <p className="text-yellow-200 text-sm mb-3">
                Create a <code className="bg-yellow-900 px-1 rounded">.env</code> file in the project root with your credentials, then restart the backend:
              </p>
              <pre className="bg-gray-950 text-green-400 text-xs rounded-lg p-3 overflow-x-auto mb-3">{`# /rihal-trading-advisor/.env
RH_EMAIL=your@email.com
RH_PASSWORD=yourpassword
RH_MFA_SECRET=           # optional: base32 TOTP secret
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_TOKEN=...       # optional
TELEGRAM_CHAT_ID=...     # optional`}</pre>
              <div className="flex gap-4 text-sm">
                {[
                  { label: 'Robinhood', ok: appStatus?.robinhood },
                  { label: 'Claude AI', ok: appStatus?.anthropic },
                  { label: 'Telegram', ok: appStatus?.telegram },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {ok
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={ok ? 'text-green-300' : 'text-red-300'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Error */}
      {scanError && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300 text-sm">Scan failed</div>
            <div className="text-red-200 text-sm mt-0.5">{scanError}</div>
          </div>
        </div>
      )}

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
          disabled={scanning || !!notConfigured}
          title={notConfigured ? 'Add Robinhood credentials to .env first' : 'Scan your watchlist'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {loading && !signals.length ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : signals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {notConfigured
            ? <p className="text-sm">Add your credentials above, restart the backend, then click <strong>Run Scan</strong>.</p>
            : <><p className="mb-2">No signals yet.</p><p className="text-sm">Click "Run Scan" to analyze your watchlist.</p></>
          }
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
