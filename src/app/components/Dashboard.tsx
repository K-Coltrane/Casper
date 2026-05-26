import { Play, Square, AlertTriangle } from 'lucide-react';

const activityFeed = [
  { text: 'Scanning SOL/USDT...', time: '2s ago' },
  { text: 'Signal detected BTC (strong)', time: '12s ago' },
  { text: 'Entered ETH trade', time: '1m ago' },
  { text: 'Monitoring exit conditions', time: '2m ago' },
];

export default function Dashboard() {
  const isRunning = true;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
      {/* STATUS STRIP */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--casper-bg-card)',
          boxShadow: isRunning ? '0 0 20px rgba(0, 255, 133, 0.15)' : 'none'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: isRunning ? 'var(--casper-green)' : 'var(--casper-red)' }}
          />
          <span className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
            CASPER {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>Balance</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--casper-text-primary)' }}>
              $1,240.55
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>Today P/L</p>
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--casper-green)' }}>
                +$12.40
              </span>
              <span className="text-sm ml-2" style={{ color: 'var(--casper-green)' }}>
                +1.01%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTROL PANEL */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--casper-bg-card)' }}
      >
        {/* START / STOP Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="py-4 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: 'var(--casper-green)',
              color: '#000',
              boxShadow: '0 4px 14px rgba(0, 255, 133, 0.3)'
            }}
          >
            <Play className="w-5 h-5 mx-auto" />
          </button>
          <button
            className="py-4 rounded-xl font-bold transition-all"
            style={{
              backgroundColor: 'var(--casper-red)',
              color: 'var(--casper-text-primary)',
              boxShadow: '0 4px 14px rgba(255, 59, 59, 0.3)'
            }}
          >
            <Square className="w-5 h-5 mx-auto" />
          </button>
        </div>

        {/* EMERGENCY KILL SWITCH */}
        <button
          className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse"
          style={{
            backgroundColor: 'var(--casper-red)',
            color: 'var(--casper-text-primary)',
            boxShadow: '0 6px 20px rgba(255, 59, 59, 0.4)'
          }}
        >
          <AlertTriangle className="w-5 h-5" />
          EMERGENCY KILL SWITCH
        </button>
      </div>

      {/* LIVE ACTIVITY FEED */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--casper-bg-card)' }}
      >
        <h3 className="font-bold mb-4" style={{ color: 'var(--casper-text-primary)' }}>
          Live Activity
        </h3>
        <div className="space-y-3">
          {activityFeed.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--casper-green)' }}
                />
                <span className="text-sm" style={{ color: 'var(--casper-text-secondary)' }}>
                  {activity.text}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PERFORMANCE SNAPSHOT */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
            Daily Target
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-text-primary)' }}>
            $10 / $10
          </p>
        </div>

        <div
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
            Win Rate
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-green)' }}>
            72%
          </p>
        </div>

        <div
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
            Active Trades
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-text-primary)' }}>
            3
          </p>
        </div>

        <div
          className="rounded-2xl p-4 text-center"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
            Risk Level
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--casper-blue)' }}>
            Balanced
          </p>
        </div>
      </div>
    </div>
  );
}
