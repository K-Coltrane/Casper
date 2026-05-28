import { useMemo, useState } from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import type { ApiKey, ExchangeId, Portfolio, Settings, Trade } from '../lib/api';
import { formatCurrency } from '../lib/format';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog';

type DashboardProps = {
  isRunning: boolean;
  portfolio: Portfolio;
  settings: Settings;
  trades: Trade[];
  apiStatus: 'connecting' | 'connected' | 'offline';
  apiKeys: ApiKey[];
  onRequireConnect: () => void;
  onStart: () => void;
  onStop: () => void;
  onEmergencyStop: () => void;
};

export default function Dashboard({
  isRunning,
  portfolio,
  settings,
  trades,
  apiStatus,
  apiKeys,
  onRequireConnect,
  onStart,
  onStop,
  onEmergencyStop
}: DashboardProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const selectedExchange: ExchangeId = settings.exchange === 'COINBASE' ? 'COINBASE' : 'BYBIT';
  const isExchangeConnected = useMemo(
    () => apiKeys.some((key) => key.exchange === selectedExchange),
    [apiKeys, selectedExchange]
  );

  const openTrades = trades.filter((trade) => trade.status === 'OPEN');
  const closedTrades = trades.filter((trade) => trade.status === 'CLOSED');
  const winningTrades = closedTrades.filter((trade) => (trade.pnl ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;
  const targetProgress = `${formatCurrency(portfolio.pnlToday)} / ${formatCurrency(settings.dailyTarget)}`;
  const activityFeed = [
    { text: `Backend API ${apiStatus}`, time: 'now' },
    { text: `${openTrades.length} open trade${openTrades.length === 1 ? '' : 's'}`, time: 'live' },
    { text: `Strategy: ${settings.strategy}`, time: 'live' },
    { text: `Daily risk limit ${formatCurrency(settings.dailyLossLimit)}`, time: 'live' }
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 pb-6 space-y-4">
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
              {formatCurrency(portfolio.balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: 'var(--casper-text-dim)' }}>Today P/L</p>
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--casper-green)' }}>
                {formatCurrency(portfolio.pnlToday)}
              </span>
              <span className="text-sm ml-2" style={{ color: 'var(--casper-green)' }}>
                {portfolio.balance > 0 ? `${((portfolio.pnlToday / portfolio.balance) * 100).toFixed(2)}%` : '0.00%'}
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
            onClick={() => {
              if (!isExchangeConnected) {
                setShowConnectDialog(true);
                return;
              }
              onStart();
            }}
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
            onClick={onStop}
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
          onClick={() => {
            if (!isExchangeConnected) {
              setShowConnectDialog(true);
              return;
            }
            onEmergencyStop();
          }}
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

      <AlertDialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect your exchange first</AlertDialogTitle>
            <AlertDialogDescription>
              To start Casper, connect an exchange account (Bybit or Coinbase) in Settings by saving API keys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConnectDialog(false);
                onRequireConnect();
              }}
            >
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {targetProgress}
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
            {winRate}%
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
            {openTrades.length}
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
            {settings.strategy}
          </p>
        </div>
      </div>
    </div>
  );
}
