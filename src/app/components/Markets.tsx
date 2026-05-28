import { useMemo, useState } from 'react';
import type { Market } from '../lib/api';
import { formatCurrency, formatPair, formatPercent } from '../lib/format';

type MarketsProps = {
  markets: Market[];
  apiStatus: 'connecting' | 'connected' | 'offline';
};

export default function Markets({ markets, apiStatus }: MarketsProps) {
  const [activeFilter, setActiveFilter] = useState<'gainers' | 'volume' | 'signal'>('gainers');

  const visibleMarkets = useMemo(() => {
    const copy = [...markets];

    if (activeFilter === 'gainers') {
      return copy.sort((a, b) => b.changePercent - a.changePercent);
    }

    if (activeFilter === 'volume') {
      return copy.sort((a, b) => b.volume - a.volume);
    }

    return copy.sort((a, b) => a.volatility - b.volatility);
  }, [activeFilter, markets]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
      {/* FILTERS */}
      <div className="px-4 py-3 sticky top-0 z-10" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('gainers')}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeFilter === 'gainers' ? 'var(--casper-green)' : 'var(--casper-bg-card)',
              color: activeFilter === 'gainers' ? '#000' : 'var(--casper-text-secondary)',
              boxShadow: activeFilter === 'gainers' ? '0 0 12px rgba(0, 255, 133, 0.3)' : 'none'
            }}
          >
            Top Gainers
          </button>
          <button
            onClick={() => setActiveFilter('volume')}
            className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: activeFilter === 'volume' ? 'var(--casper-green)' : 'var(--casper-bg-card)',
              color: activeFilter === 'volume' ? '#000' : 'var(--casper-text-secondary)',
              boxShadow: activeFilter === 'volume' ? '0 0 12px rgba(0, 255, 133, 0.3)' : 'none'
            }}
          >
            High Volume
          </button>
          <button
            onClick={() => setActiveFilter('signal')}
            className="px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap"
            style={{
              backgroundColor: activeFilter === 'signal' ? 'var(--casper-green)' : 'var(--casper-bg-card)',
              color: activeFilter === 'signal' ? '#000' : 'var(--casper-text-secondary)',
              boxShadow: activeFilter === 'signal' ? '0 0 12px rgba(0, 255, 133, 0.3)' : 'none'
            }}
          >
            Strong Signals
          </button>
        </div>
      </div>

      {/* MARKET LIST */}
      <div className="px-4 space-y-2 pb-6">
        {markets.length === 0 && (
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ backgroundColor: 'var(--casper-bg-card)', color: 'var(--casper-text-secondary)' }}
          >
            {apiStatus === 'offline' ? 'Backend offline. Start the API server to load market data.' : 'Loading market data...'}
          </div>
        )}
        {visibleMarkets.map((item) => {
          const signal = Math.min(99, Math.round((1 - item.volatility) * 100));
          const positive = item.changePercent >= 0;

          return (
            <div
            key={item.symbol}
            className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => {
              // Placeholder interaction: selecting a market row could open a detail drawer later.
              // For now, we just keep the UI responsive.
            }}
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
                  {formatPair(item.symbol)}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--casper-text-dim)' }}>
                  Vol {item.volume.toLocaleString()}
                </p>
              </div>

              {/* Center: Price */}
              <div className="text-center">
                <p className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                  {formatCurrency(item.price)}
                </p>
              </div>

              {/* Right: Change + Signal */}
              <div className="text-right flex items-center gap-3">
                <span
                  className="text-sm font-bold"
                  style={{ color: positive ? 'var(--casper-green)' : 'var(--casper-red)' }}
                >
                  {formatPercent(item.changePercent)}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: signal >= 70 ? 'var(--casper-green)' : 'var(--casper-blue)',
                    color: '#000'
                  }}
                >
                  ⭐{signal}
                </div>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
