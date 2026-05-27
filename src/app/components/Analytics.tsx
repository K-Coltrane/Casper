import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { Portfolio, Trade } from '../lib/api';
import { formatCurrency } from '../lib/format';

type AnalyticsProps = {
  portfolio: Portfolio;
  trades: Trade[];
};

export default function Analytics({ portfolio, trades }: AnalyticsProps) {
  const closedTrades = trades.filter((trade) => trade.status === 'CLOSED');
  const winningTrades = closedTrades.filter((trade) => (trade.pnl ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;
  const averageGain =
    winningTrades.length > 0
      ? winningTrades.reduce((total, trade) => total + (trade.pnl ?? 0), 0) / winningTrades.length
      : 0;
  const maxDrawdown = portfolio.balance > 0 ? (Math.min(portfolio.totalPnL, 0) / portfolio.balance) * 100 : 0;
  const chartData =
    closedTrades.length > 0
      ? closedTrades.slice(-8).map((trade, index) => ({
          value: closedTrades.slice(0, index + 1).reduce((total, item) => total + (item.pnl ?? 0), 0)
        }))
      : [{ value: 0 }, { value: portfolio.totalPnL }];

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
            {formatCurrency(portfolio.totalPnL)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--casper-green)' }}>
            Realized {formatCurrency(portfolio.realizedPnL ?? 0)}
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
            {winRate}%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--casper-text-dim)' }}>
            {winningTrades.length}/{closedTrades.length} trades
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
            {formatCurrency(averageGain)}
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
            {maxDrawdown.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
