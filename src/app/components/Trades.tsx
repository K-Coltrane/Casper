const trades = [
  { pair: 'ETH/USDT', buy: '$2,100', sell: '$2,145', profit: '+$45.00', duration: '12m', status: 'CLOSED', positive: true },
  { pair: 'SOL/USDT', buy: '$138', sell: '$142', profit: '+$4.00', duration: '8m', status: 'CLOSED', positive: true },
  { pair: 'BTC/USDT', buy: '$41,100', sell: '$40,980', profit: '-$120', duration: '25m', status: 'CLOSED', positive: false },
  { pair: 'DOGE/USDT', buy: '$0.082', sell: '$0.086', profit: '+$0.004', duration: '15m', status: 'CLOSED', positive: true },
  { pair: 'MATIC/USDT', buy: '$0.87', sell: '$0.85', profit: '-$0.02', duration: '18m', status: 'CLOSED', positive: false },
  { pair: 'AVAX/USDT', buy: '$38.50', sell: '$39.20', profit: '+$0.70', duration: '22m', status: 'CLOSED', positive: true },
];

export default function Trades() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* FILTERS */}
      <div className="px-4 py-3 sticky top-0 z-10" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: 'var(--casper-green)',
              color: '#000'
            }}
          >
            Today
          </button>
          <button
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              color: 'var(--casper-text-secondary)'
            }}
          >
            7 Days
          </button>
          <button
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              color: 'var(--casper-text-secondary)'
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* TRADE LIST */}
      <div className="px-4 space-y-3 pb-6">
        {trades.map((trade, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              borderLeft: `4px solid ${trade.positive ? 'var(--casper-green)' : 'var(--casper-red)'}`,
              minHeight: '120px'
            }}
          >
            {/* Header: Pair + Status */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {trade.pair}
              </h3>
              <span
                className="px-2 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: 'var(--casper-green)',
                  color: '#000'
                }}
              >
                {trade.status}
              </span>
            </div>

            {/* Buy → Sell */}
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span style={{ color: 'var(--casper-text-dim)' }}>Buy:</span>
              <span className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {trade.buy}
              </span>
              <span style={{ color: 'var(--casper-text-dim)' }}>→</span>
              <span style={{ color: 'var(--casper-text-dim)' }}>Sell:</span>
              <span className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {trade.sell}
              </span>
            </div>

            {/* Profit + Duration */}
            <div className="flex items-center justify-between">
              <span
                className="text-lg font-bold"
                style={{ color: trade.positive ? 'var(--casper-green)' : 'var(--casper-red)' }}
              >
                Profit: {trade.profit}
              </span>
              <div className="text-right text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                <p>Duration: {trade.duration}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
