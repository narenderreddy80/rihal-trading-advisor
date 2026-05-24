import { useEffect, useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { fetchSignals, fetchSignal, triggerScan, Signal } from '../api'
import SignalCard from '../components/SignalCard'
import SignalDetail from './SignalDetail'

const FILTERS = ['ALL', 'BUY', 'SELL', 'HOLD', 'BUY CALL', 'BUY PUT'] as const

export default function Signals() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lookupSymbol, setLookupSymbol] = useState('')

  useEffect(() => {
    fetchSignals().then(setSignals).finally(() => setLoading(false))
  }, [])

  const handleScan = () => {
    setScanning(true)
    triggerScan().finally(() => {
      setTimeout(() => {
        fetchSignals().then(setSignals).finally(() => setScanning(false))
      }, 6000)
    })
  }

  const handleLookup = () => {
    const sym = lookupSymbol.trim().toUpperCase()
    if (!sym) return
    setLoading(true)
    fetchSignal(sym)
      .then(sig => {
        setSignals(prev => {
          const filtered = prev.filter(s => s.symbol !== sym)
          return [sig, ...filtered]
        })
        setSelected(sig)
      })
      .finally(() => setLoading(false))
  }

  const filtered = signals.filter(s => {
    const matchFilter = filter === 'ALL' || s.ai?.action === filter
    const matchSearch = !search || s.symbol.includes(search.toUpperCase())
    return matchFilter && matchSearch
  })

  if (selected) return <SignalDetail signal={selected} onBack={() => setSelected(null)} />

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter symbols..."
              className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-36"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            Scan
          </button>
        </div>
      </div>

      {/* Symbol lookup */}
      <div className="flex gap-2">
        <input
          value={lookupSymbol}
          onChange={e => setLookupSymbol(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
          placeholder="Look up any symbol (e.g. AAPL)..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 flex-1 max-w-xs"
        />
        <button
          onClick={handleLookup}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          Analyze
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />)}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-500">
              No signals match your filter. Try "Run Scan" first.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
