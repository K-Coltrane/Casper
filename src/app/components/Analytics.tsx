import { useMemo, useState } from 'react';
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Portfolio, Trade } from '../lib/api';
import { formatCurrency } from '../lib/format';

type AnalyticsProps = {
  portfolio: Portfolio;
  trades: Trade[];
};

export default function Analytics({ portfolio, trades }: AnalyticsProps) {
  const [activePeriod, setActivePeriod] = useState<'1D' | '7D' | '30D'>('7D');

  const periodCutoffMs = useMemo(() => {
    const now = Date.now();
    if (activePeriod === '1D') return now - 1 * 24 * 60 * 60_000;
    if (activePeriod === '7D') return now - 7 * 24 * 60 * 60_000;
    return now - 30 * 24 * 60 * 60_000;
  }, [activePeriod]);

  const periodTrades = useMemo(
    () => trades.filter((trade) => new Date(trade.createdAt).getTime() >= periodCutoffMs),
    [periodCutoffMs, trades]
  );

  const closedTrades = periodTrades.filter((trade) => trade.status === 'CLOSED');
  const winningTrades = closedTrades.filter((trade) => (trade.pnl ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;
  const averageGain =
    winningTrades.length > 0
      ? winningTrades.reduce((total, trade) => total + (trade.pnl ?? 0), 0) / winningTrades.length
      : 0;
  const maxDrawdown = portfolio.balance > 0 ? (Math.min(portfolio.totalPnL, 0) / portfolio.balance) * 100 : 0;
  const chartData = useMemo(() => {
    if (closedTrades.length === 0) {
      return [
        { idx: 0, value: 0 },
        { idx: 1, value: portfolio.totalPnL }
      ];
    }

    let running = 0;
    return closedTrades
      .slice(-50)
      .map((trade, idx) => {
        running += trade.pnl ?? 0;
        return { idx, value: running };
      });
  }, [closedTrades, portfolio.totalPnL]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-6 space-y-4">
      {/* TIME FILTERS */}
      <div className="flex items-center gap-2">
        {(['1D', '7D', '30D'] as const).map((period) => (
          <button
            key={period}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: activePeriod === period ? 'var(--casper-green)' : 'var(--casper-bg-card)',
              color: activePeriod === period ? '#000' : 'var(--casper-text-secondary)'
            }}
            onClick={() => setActivePeriod(period)}
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
          Profit Growth ({activePeriod})
        </p>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="idx" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'PnL']}
                labelFormatter={() => ''}
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--casper-green)"
                strokeWidth={3}
                dot={false}
              />
              {chartData.length > 10 ? (
                <Brush dataKey="idx" height={18} travellerWidth={10} stroke="var(--casper-green)" />
              ) : null}
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
