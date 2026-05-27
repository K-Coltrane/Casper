import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-6 space-y-4">
      {/* API CONNECTION */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
          🔐 API CONNECTION
        </h3>
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: 'var(--casper-text-primary)' }}>
              Bybit
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--casper-green)' }}>
                Connected
              </span>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--casper-green)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* RISK CONTROLS */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
          ⚠ RISK CONTROL SLIDERS
        </h3>
        <div
          className="rounded-2xl p-4 space-y-5"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          {/* Max per trade */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                Max per trade
              </span>
              <span className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
                2%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              defaultValue="2"
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'var(--casper-bg-primary)',
              }}
            />
          </div>

          {/* Daily loss limit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                Daily loss limit
              </span>
              <span className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
                $20
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              defaultValue="20"
              step="10"
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'var(--casper-bg-primary)',
              }}
            />
          </div>

          {/* Daily profit target */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
                Daily profit target
              </span>
              <span className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
                $10
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              defaultValue="10"
              step="5"
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'var(--casper-bg-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* STRATEGY MODE */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
          🎯 STRATEGY MODE
        </h3>
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="strategy" className="w-4 h-4" />
              <span className="text-sm" style={{ color: 'var(--casper-text-secondary)' }}>
                Conservative
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="strategy" defaultChecked className="w-4 h-4" />
              <span className="text-sm font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                Balanced
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="strategy" className="w-4 h-4" />
              <span className="text-sm" style={{ color: 'var(--casper-text-secondary)' }}>
                Aggressive
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* MEME COINS TOGGLE */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
          🪙 MEME COINS
        </h3>
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--casper-text-primary)' }}>
              Trade meme coins
            </span>
            <button
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ backgroundColor: 'var(--casper-green)' }}
            >
              <span
                className="inline-block h-5 w-5 transform translate-x-6 rounded-full bg-white transition-transform shadow-lg"
              />
            </button>
          </div>
        </div>
      </div>

      {/* KILL SWITCH */}
      <div className="space-y-3 pt-4">
        <h3 className="font-bold text-sm" style={{ color: 'var(--casper-text-primary)' }}>
          🛑 KILL SWITCH
        </h3>
        <button
          className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 animate-pulse"
          style={{
            backgroundColor: 'var(--casper-red)',
            color: 'var(--casper-text-primary)',
            boxShadow: '0 6px 20px rgba(255, 59, 59, 0.4)'
          }}
        >
          <AlertTriangle className="w-5 h-5" />
          STOP ALL TRADING
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--casper-text-dim)' }}>
          Immediately stops all trading activity
        </p>
      </div>
    </div>
  );
}
