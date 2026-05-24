import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchChart, OHLCV } from '../api'

interface Props {
  symbol: string
}

export default function StockChart({ symbol }: Props) {
  const [data, setData] = useState<OHLCV[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchChart(symbol)
      .then(setData)
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) return <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div>
  if (!data.length) return <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No chart data</div>

  const first = data[0]?.close ?? 0
  const last = data[data.length - 1]?.close ?? 0
  const isUp = last >= first
  const color = isUp ? '#22c55e' : '#ef4444'

  const formatted = data.map(d => ({
    time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    price: d.close,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          width={55}
          tickFormatter={v => `$${v.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${symbol})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
