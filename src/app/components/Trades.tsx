import type { Trade } from '../lib/api';
import { formatCurrency, formatPair } from '../lib/format';

type TradesProps = {
  trades: Trade[];
};

function tradeDuration(trade: Trade) {
  const end = trade.closedAt ? new Date(trade.closedAt).getTime() : Date.now();
  const start = new Date(trade.createdAt).getTime();
  const minutes = Math.max(0, Math.round((end - start) / 60_000));

  return `${minutes}m`;
}

export default function Trades({ trades }: TradesProps) {
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
        {trades.length === 0 && (
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ backgroundColor: 'var(--casper-bg-card)', color: 'var(--casper-text-secondary)' }}
          >
            No trades yet. Start the bot or create a test trade from the backend API.
          </div>
        )}
        {trades.map((trade) => {
          const positive = (trade.pnl ?? 0) >= 0;

          return (
            <div
            key={trade.id}
            className="rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              borderLeft: `4px solid ${positive ? 'var(--casper-green)' : 'var(--casper-red)'}`,
              minHeight: '120px'
            }}
          >
            {/* Header: Pair + Status */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {formatPair(trade.symbol)}
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
              <span style={{ color: 'var(--casper-text-dim)' }}>Entry:</span>
              <span className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {formatCurrency(trade.entryPrice)}
              </span>
              <span style={{ color: 'var(--casper-text-dim)' }}>→</span>
              <span style={{ color: 'var(--casper-text-dim)' }}>Exit:</span>
              <span className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
              </span>
            </div>

            {/* Profit + Duration */}
            <div className="flex items-center justify-between">
              <span
                className="text-lg font-bold"
                style={{ color: positive ? 'var(--casper-green)' : 'var(--casper-red)' }}
              >
                P/L: {formatCurrency(trade.pnl ?? 0)}
              </span>
              <div className="text-right text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                <p>Duration: {tradeDuration(trade)}</p>
                <p>Strategy: {trade.strategy ?? 'balanced'}</p>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
