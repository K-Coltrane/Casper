import { LineChart, Line, ResponsiveContainer } from 'recharts';

const chartData = [
  { value: 100 },
  { value: 105 },
  { value: 110 },
  { value: 108 },
  { value: 115 },
  { value: 120 },
  { value: 125 },
  { value: 128 },
];

export default function Analytics() {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
      {/* TIME FILTERS */}
      <div className="flex items-center gap-2">
        {['1D', '7D', '30D'].map((period, idx) => (
          <button
            key={period}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: idx === 1 ? 'var(--casper-green)' : 'var(--casper-bg-card)',
              color: idx === 1 ? '#000' : 'var(--casper-text-secondary)'
            }}
          >
            {period}
          </button>
        ))}
      </div>

      {/* PROFIT GRAPH */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--casper-bg-card)' }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
          Profit Growth (7 Days)
        </p>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--casper-green)"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>
            Total Profit
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-green)' }}>
            +$128
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--casper-green)' }}>
            +87.3%
          </p>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>
            Win Rate
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-text-primary)' }}>
            71%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--casper-text-dim)' }}>
            78/89 trades
          </p>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>
            Avg Gain
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-green)' }}>
            +$4.20
          </p>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>
            Max Drawdown
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-red)' }}>
            -6.1%
          </p>
        </div>
      </div>
    </div>
  );
}
