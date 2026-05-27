import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, History, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Markets from './components/Markets';
import Trades from './components/Trades';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import {
  casperApi,
  getAccessToken,
  getApiBaseUrl,
  resetApiSession,
  setApiBaseUrl,
  type BotStatus,
  type Market,
  type Portfolio,
  type Settings as ApiSettings,
  type Trade
} from './lib/api';
import { formatCurrency } from './lib/format';

type Tab = 'dashboard' | 'markets' | 'trades' | 'analytics' | 'settings';

const fallbackPortfolio: Portfolio = {
  balance: 0,
  pnlToday: 0,
  totalPnL: 0,
  realizedPnL: 0,
  unrealizedPnL: 0,
  openPositionValue: 0,
  openPositions: []
};

const fallbackSettings: ApiSettings = {
  maxTradePercent: 0.1,
  dailyLossLimit: 100,
  dailyTarget: 250,
  strategy: 'balanced',
  memeCoins: false,
  botEnabled: false,
  maxTradesPerDay: 5,
  maxDrawdownPercent: 10,
  maxOpenTrades: 3,
  maxExposurePercent: 0.5,
  tradeCooldownSecs: 60,
  stopLossPercent: 2
};

const fallbackBotStatus: BotStatus = {
  global: {
    enabled: false,
    emergencyStopped: false
  },
  user: {
    botEnabled: false,
    maxTradesPerDay: 5,
    tradesToday: 0,
    pnlToday: 0
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [token, setToken] = useState<string>();
  const [portfolio, setPortfolio] = useState<Portfolio>(fallbackPortfolio);
  const [settings, setSettings] = useState<ApiSettings>(fallbackSettings);
  const [botStatus, setBotStatus] = useState<BotStatus>(fallbackBotStatus);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const isRunning = botStatus.global.enabled && botStatus.user.botEnabled && !botStatus.global.emergencyStopped;

  const refreshData = useCallback(async (activeToken: string) => {
    const [portfolioResponse, tradesResponse, settingsResponse, botResponse, pairsResponse] = await Promise.all([
      casperApi.getPortfolio(activeToken),
      casperApi.getTrades(activeToken),
      casperApi.getSettings(activeToken),
      casperApi.getBotStatus(activeToken),
      casperApi.getPairs(activeToken)
    ]);
    const marketResponses = await Promise.all(
      pairsResponse.pairs.slice(0, 8).map((symbol) => casperApi.getMarket(activeToken, symbol))
    );

    setPortfolio(portfolioResponse.portfolio);
    setTrades(tradesResponse.trades);
    setSettings(settingsResponse.settings);
    setBotStatus(botResponse);
    setMarkets(marketResponses.map((response) => response.market));
    setApiStatus('connected');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const activeToken = await getAccessToken();
        if (cancelled) return;
        setToken(activeToken);
        await refreshData(activeToken);
      } catch {
        if (!cancelled) {
          setApiStatus('offline');
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, refreshData]);

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(casperApi.marketStreamUrl(token, 'BTCUSDT'));

    socket.onmessage = (event) => {
      const market = JSON.parse(event.data) as Market;
      if (!market.symbol) return;

      setMarkets((currentMarkets) => {
        const otherMarkets = currentMarkets.filter((item) => item.symbol !== market.symbol);
        return [market, ...otherMarkets].slice(0, 8);
      });
    };

    return () => {
      socket.close();
    };
  }, [apiBaseUrl, token]);

  const runBotAction = async (action: 'start' | 'stop' | 'emergency-stop') => {
    if (!token) return;

    if (action === 'start') {
      await casperApi.startBot(token);
    } else if (action === 'stop') {
      await casperApi.stopBot(token);
    } else {
      await casperApi.emergencyStop(token);
    }

    await refreshData(token);
  };

  const updateSettings = async (nextSettings: Partial<ApiSettings>) => {
    if (!token) return;

    const response = await casperApi.updateSettings(token, nextSettings);
    setSettings(response.settings);
    await refreshData(token);
  };

  const updateApiBaseUrl = (nextApiBaseUrl: string) => {
    setApiBaseUrl(nextApiBaseUrl);
    resetApiSession();
    setToken(undefined);
    setPortfolio(fallbackPortfolio);
    setSettings(fallbackSettings);
    setBotStatus(fallbackBotStatus);
    setTrades([]);
    setMarkets([]);
    setApiStatus('connecting');
    setApiBaseUrlState(getApiBaseUrl());
  };

  const tabs = [
    { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'markets' as Tab, icon: TrendingUp, label: 'Markets' },
    { id: 'trades' as Tab, icon: History, label: 'Trades' },
    { id: 'analytics' as Tab, icon: BarChart3, label: 'Analytics' },
    { id: 'settings' as Tab, icon: SettingsIcon, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            isRunning={isRunning}
            portfolio={portfolio}
            settings={settings}
            trades={trades}
            apiStatus={apiStatus}
            onStart={() => void runBotAction('start')}
            onStop={() => void runBotAction('stop')}
            onEmergencyStop={() => void runBotAction('emergency-stop')}
          />
        );
      case 'markets':
        return <Markets markets={markets} apiStatus={apiStatus} />;
      case 'trades':
        return <Trades trades={trades} />;
      case 'analytics':
        return <Analytics portfolio={portfolio} trades={trades} />;
      case 'settings':
        return (
          <Settings
            settings={settings}
            botStatus={botStatus}
            apiStatus={apiStatus}
            apiBaseUrl={apiBaseUrl}
            onUpdate={updateSettings}
            onApiBaseUrlChange={updateApiBaseUrl}
            onEmergencyStop={() => void runBotAction('emergency-stop')}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="size-full min-h-0 flex items-center justify-center" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
      {/* Mobile App Container */}
      <div className="w-full max-w-[390px] h-full min-h-0 flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
        {/* iOS Status Bar */}
        <div className="h-11 flex items-center justify-between px-6 pt-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--casper-text-primary)' }}>
            9:41
          </span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white/20 rounded" />
            <div className="w-4 h-4 bg-white/20 rounded" />
            <div className="w-6 h-4 bg-white/20 rounded" />
          </div>
        </div>

        {/* TOP STATUS BAR (Fixed) */}
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
          <div
            className="rounded-2xl p-3 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--casper-bg-card)',
              boxShadow: isRunning ? '0 0 15px rgba(0, 255, 133, 0.1)' : 'none'
            }}
          >
            {/* Left: Running Status */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isRunning ? 'var(--casper-green)' : 'var(--casper-red)' }}
              />
              <span className="text-xs font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>

            {/* Center: Balance */}
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>Balance</p>
              <p className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>
                {formatCurrency(portfolio.balance)}
              </p>
            </div>

            {/* Right: Today P/L */}
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>Today</p>
              <p
                className="font-bold text-sm"
                style={{ color: portfolio.pnlToday >= 0 ? 'var(--casper-green)' : 'var(--casper-red)' }}
              >
                {formatCurrency(portfolio.pnlToday)}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <div
          className="px-2 pb-6 pt-2"
          style={{
            backgroundColor: 'var(--casper-bg-card)',
            borderTop: '1px solid var(--casper-border)'
          }}
        >
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center gap-1 py-2 px-3 transition-colors"
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? 'var(--casper-green)' : 'var(--casper-text-dim)' }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: isActive ? 'var(--casper-green)' : 'var(--casper-text-dim)' }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}