import { useState } from 'react';
import { LayoutDashboard, TrendingUp, History, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Markets from './components/Markets';
import Trades from './components/Trades';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

type Tab = 'dashboard' | 'markets' | 'trades' | 'analytics' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const isRunning = true;

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
        return <Dashboard />;
      case 'markets':
        return <Markets />;
      case 'trades':
        return <Trades />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="size-full flex items-center justify-center" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
      {/* Mobile App Container */}
      <div className="w-full max-w-[390px] h-full flex flex-col relative" style={{ backgroundColor: 'var(--casper-bg-primary)' }}>
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
              <p className="font-bold" style={{ color: 'var(--casper-text-primary)' }}>$1,240</p>
            </div>

            {/* Right: Today P/L */}
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--casper-text-dim)' }}>Today</p>
              <p className="font-bold text-sm" style={{ color: 'var(--casper-green)' }}>+$12.40</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
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