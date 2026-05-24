import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { fetchPortfolio, fetchAccount, Position, AccountInfo } from '../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([])
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchPortfolio(), fetchAccount()])
      .then(([pos, acc]) => { setPositions(pos); setAccount(acc) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-500">Loading portfolio...</div>

  const totalValue = positions.reduce((sum, p) => sum + p.market_value, 0)
  const pieData = positions.map(p => ({ name: p.symbol, value: p.market_value }))
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Summary */}
      {account && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Equity', value: `$${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
            { label: 'Invested', value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
            { label: 'Unrealized P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'Cash', value: `$${account.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-2">{label}</div>
              <div className={`text-xl font-bold ${color ?? 'text-white'}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Allocation Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Allocation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Positions Table */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  {['Symbol', 'Qty', 'Avg Cost', 'Current', 'Value', 'P&L', 'P&L%'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4 font-bold">{p.symbol}</td>
                    <td className="py-3 pr-4 text-gray-400">{p.quantity}</td>
                    <td className="py-3 pr-4">${p.avg_cost.toFixed(2)}</td>
                    <td className="py-3 pr-4">${p.current_price.toFixed(2)}</td>
                    <td className="py-3 pr-4">${p.market_value.toFixed(2)}</td>
                    <td className={`py-3 pr-4 flex items-center gap-1 ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      ${Math.abs(p.pnl).toFixed(2)}
                    </td>
                    <td className={`py-3 ${p.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.pnl_pct >= 0 ? '+' : ''}{p.pnl_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-500">No open positions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
