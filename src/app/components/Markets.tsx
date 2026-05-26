const marketData = [
  { pair: 'SOL/USDT', price: '$142.20', change: '+2.4%', signal: 87, positive: true },
  { pair: 'BTC/USDT', price: '$41,100', change: '+0.9%', signal: 64, positive: true },
  { pair: 'DOGE/USDT', price: '$0.082', change: '+5.1%', signal: 91, positive: true },
  { pair: 'ETH/USDT', price: '$3,247', change: '+1.2%', signal: 72, positive: true },
  { pair: 'MATIC/USDT', price: '$0.87', change: '-0.8%', signal: 58, positive: false },
  { pair: 'AVAX/USDT', price: '$38.92', change: '+3.2%', signal: 79, positive: true },
  { pair: 'ADA/USDT', price: '$0.58', change: '-1.4%', signal: 45, positive: false },
  { pair: 'DOT/USDT', price: '$7.34', change: '+2.1%', signal: 66, positive: true },
];

export default function Markets() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* FILTERS */}
      <div className="px-4 py-3 sticky top-0 z-10" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            style={{
              backgroundColor: 'var(--casper-green)',
              color: '#000',
              boxShadow: '0 0 12px rgba(0, 255, 133, 0.3)'
            }}
          >
            Top Gainers
          </button>
          <button
            className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              color: 'var(--casper-text-secondary)'
            }}
          >
            High Volume
          </button>
          <button
            className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              color: 'var(--casper-text-secondary)'
            }}
          >
            Strong Signals
          </button>
        </div>
      </div>

      {/* MARKET LIST */}
      <div className="px-4 space-y-2 pb-6">
        {marketData.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              border: '1px solid var(--casper-border)',
              height: '64px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div className="flex items-center justify-between w-full">
              {/* Left: Coin Pair */}
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
                  {item.pair}
                </p>
              </div>

              {/* Center: Price */}
              <div className="text-center">
                <p className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                  {item.price}
                </p>
              </div>

              {/* Right: Change + Signal */}
              <div className="text-right flex items-center gap-3">
                <span
                  className="text-sm font-bold"
                  style={{ color: item.positive ? 'var(--casper-green)' : 'var(--casper-red)' }}
                >
                  {item.change}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: item.signal >= 70 ? 'var(--casper-green)' : 'var(--casper-blue)',
                    color: '#000'
                  }}
                >
                  ⭐{item.signal}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
