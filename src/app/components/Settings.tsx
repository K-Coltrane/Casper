import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { ApiKey, BotStatus, ExchangeId, Settings as ApiSettings } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { casperApi } from '../lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog';

type SettingsProps = {
  settings: ApiSettings;
  botStatus: BotStatus;
  apiStatus: 'connecting' | 'connected' | 'offline';
  apiBaseUrl: string;
  apiKeys: ApiKey[];
  onUpdate: (settings: Partial<ApiSettings>) => void | Promise<void>;
  onApiBaseUrlChange: (apiBaseUrl: string) => void;
  onEmergencyStop: () => void;
};

export default function Settings({
  settings,
  botStatus,
  apiStatus,
  apiBaseUrl,
  apiKeys,
  onUpdate,
  onApiBaseUrlChange,
  onEmergencyStop
}: SettingsProps) {
  const isConnected = apiStatus === 'connected';
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);
  const [exchangeApiKey, setExchangeApiKey] = useState('');
  const [exchangeApiSecret, setExchangeApiSecret] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keySaveError, setKeySaveError] = useState<string>();

  useEffect(() => {
    setDraftApiBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const selectedExchange: ExchangeId = settings.exchange === 'COINBASE' ? 'COINBASE' : 'BYBIT';
  const isExchangeConnected = useMemo(() => apiKeys.some((key) => key.exchange === selectedExchange), [apiKeys, selectedExchange]);

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
              {selectedExchange === 'COINBASE' ? 'Coinbase' : 'Bybit'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: isConnected ? 'var(--casper-green)' : 'var(--casper-red)' }}>
                {isConnected ? 'Connected' : 'Backend offline'}
              </span>
              <CheckCircle className="w-4 h-4" style={{ color: isConnected ? 'var(--casper-green)' : 'var(--casper-red)' }} />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
            Exchange (choose which account Casper trades on)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => void onUpdate({ exchange: 'BYBIT' })}
              className="py-3 rounded-xl text-xs font-bold"
              style={{
                backgroundColor: selectedExchange === 'BYBIT' ? 'var(--casper-green)' : 'var(--casper-bg-primary)',
                color: selectedExchange === 'BYBIT' ? '#000' : 'var(--casper-text-secondary)',
                border: '1px solid var(--casper-border)'
              }}
            >
              Bybit
            </button>
            <button
              onClick={() => void onUpdate({ exchange: 'COINBASE' })}
              className="py-3 rounded-xl text-xs font-bold"
              style={{
                backgroundColor: selectedExchange === 'COINBASE' ? 'var(--casper-green)' : 'var(--casper-bg-primary)',
                color: selectedExchange === 'COINBASE' ? '#000' : 'var(--casper-text-secondary)',
                border: '1px solid var(--casper-border)'
              }}
            >
              Coinbase
            </button>
          </div>
          <p className="text-xs" style={{ color: isExchangeConnected ? 'var(--casper-green)' : 'var(--casper-text-dim)' }}>
            {isExchangeConnected ? 'API keys saved for this exchange' : 'API keys not connected yet'}
          </p>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
            Connect {selectedExchange === 'COINBASE' ? 'Coinbase' : 'Bybit'} (paste API credentials)
          </p>
          <input
            value={exchangeApiKey}
            onChange={(event) => setExchangeApiKey(event.target.value)}
            placeholder={selectedExchange === 'COINBASE' ? 'Coinbase API key name' : 'Bybit API key'}
            className="w-full rounded-xl px-3 py-3 text-xs outline-none"
            style={{
              backgroundColor: 'var(--casper-bg-primary)',
              color: 'var(--casper-text-primary)',
              border: '1px solid var(--casper-border)'
            }}
          />
          <textarea
            value={exchangeApiSecret}
            onChange={(event) => setExchangeApiSecret(event.target.value)}
            placeholder={selectedExchange === 'COINBASE' ? 'Coinbase API secret (EC private key PEM)' : 'Bybit API secret'}
            className="w-full rounded-xl px-3 py-3 text-xs outline-none min-h-24"
            style={{
              backgroundColor: 'var(--casper-bg-primary)',
              color: 'var(--casper-text-primary)',
              border: '1px solid var(--casper-border)'
            }}
          />
          {keySaveError ? (
            <p className="text-xs" style={{ color: 'var(--casper-red)' }}>
              {keySaveError}
            </p>
          ) : null}
          <button
            disabled={!isConnected || isSavingKeys || exchangeApiKey.trim().length === 0 || exchangeApiSecret.trim().length === 0}
            onClick={async () => {
              try {
                setIsSavingKeys(true);
                setKeySaveError(undefined);
                const token = localStorage.getItem('casper.accessToken');
                if (!token) throw new Error('Not authenticated');
                await casperApi.addApiKey(token, {
                  exchange: selectedExchange,
                  apiKey: exchangeApiKey.trim(),
                  secret: exchangeApiSecret
                });
                // App refresh loop will pick up new keys shortly.
                setExchangeApiKey('');
                setExchangeApiSecret('');
              } catch (error) {
                setKeySaveError(error instanceof Error ? error.message : 'Failed to save keys');
              } finally {
                setIsSavingKeys(false);
              }
            }}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            style={{
              backgroundColor: 'var(--casper-green)',
              color: '#000'
            }}
          >
            {isSavingKeys ? 'SAVING…' : 'SAVE API KEYS'}
          </button>
          <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
            Keys are sent to your backend and stored encrypted. Never paste keys into a frontend-only app.
          </p>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--casper-bg-card)' }}
        >
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--casper-text-dim)' }}>
              Backend server URL for this phone
            </p>
            <input
              value={draftApiBaseUrl}
              onChange={(event) => setDraftApiBaseUrl(event.target.value)}
              placeholder="https://api.yourdomain.com or http://192.168.1.25:4000"
              className="w-full rounded-xl px-3 py-3 text-xs outline-none"
              style={{
                backgroundColor: 'var(--casper-bg-primary)',
                color: 'var(--casper-text-primary)',
                border: '1px solid var(--casper-border)'
              }}
            />
          </div>
          <button
            onClick={() => onApiBaseUrlChange(draftApiBaseUrl)}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{
              backgroundColor: 'var(--casper-green)',
              color: '#000'
            }}
          >
            SAVE BACKEND URL
          </button>
          <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>
            For a real phone, use your hosted backend URL or your computer LAN IP, not 10.0.2.2.
          </p>
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
                {(settings.maxTradePercent * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={Math.round(settings.maxTradePercent * 100)}
              onChange={(event) => void onUpdate({ maxTradePercent: Number(event.target.value) / 100 })}
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
                {formatCurrency(settings.dailyLossLimit)}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.dailyLossLimit}
              step="10"
              onChange={(event) => void onUpdate({ dailyLossLimit: Number(event.target.value) })}
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
                {formatCurrency(settings.dailyTarget)}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.dailyTarget}
              step="5"
              onChange={(event) => void onUpdate({ dailyTarget: Number(event.target.value) })}
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
              <input
                type="radio"
                name="strategy"
                checked={settings.strategy === 'conservative'}
                onChange={() => void onUpdate({ strategy: 'conservative' })}
                className="w-4 h-4"
              />
              <span className="text-sm" style={{ color: 'var(--casper-text-secondary)' }}>
                Conservative
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                checked={settings.strategy === 'balanced'}
                onChange={() => void onUpdate({ strategy: 'balanced' })}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                Balanced
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                checked={settings.strategy === 'aggressive'}
                onChange={() => void onUpdate({ strategy: 'aggressive' })}
                className="w-4 h-4"
              />
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
              onClick={() => void onUpdate({ memeCoins: !settings.memeCoins })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ backgroundColor: settings.memeCoins ? 'var(--casper-green)' : 'var(--casper-border)' }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                  settings.memeCoins ? 'translate-x-6' : 'translate-x-1'
                }`}
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
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
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stop all trading?</AlertDialogTitle>
              <AlertDialogDescription>
                This triggers the global emergency stop immediately. You can resume later from the backend.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onEmergencyStop}>Yes, stop</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-xs text-center" style={{ color: 'var(--casper-text-dim)' }}>
          Immediately stops all trading activity. Current global state:{' '}
          {botStatus.global.emergencyStopped ? 'emergency stopped' : 'armed'}
        </p>
      </div>
    </div>
  );
}
