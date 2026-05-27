const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@casper.local';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'casper-demo-password';
const API_BASE_STORAGE_KEY = 'casper.apiBaseUrl';
const TOKEN_STORAGE_KEY = 'casper.accessToken';
const REFRESH_STORAGE_KEY = 'casper.refreshToken';

export type Portfolio = {
  balance: number;
  pnlToday: number;
  totalPnL: number;
  realizedPnL?: number;
  unrealizedPnL?: number;
  openPositionValue?: number;
  openPositions?: Trade[];
};

export type Trade = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  pnl?: number | null;
  status: string;
  strategy?: string;
  createdAt: string;
  closedAt?: string | null;
};

export type Market = {
  symbol: string;
  price: number;
  volume: number;
  changePercent: number;
  volatility: number;
  timestamp: string;
};

export type Settings = {
  maxTradePercent: number;
  dailyLossLimit: number;
  dailyTarget: number;
  strategy: 'conservative' | 'balanced' | 'aggressive';
  memeCoins: boolean;
  botEnabled: boolean;
  maxTradesPerDay: number;
  maxDrawdownPercent: number;
  maxOpenTrades: number;
  maxExposurePercent: number;
  tradeCooldownSecs: number;
  stopLossPercent: number;
};

export type BotStatus = {
  global: {
    enabled: boolean;
    emergencyStopped: boolean;
    reason?: string | null;
  };
  user: {
    botEnabled: boolean;
    maxTradesPerDay: number;
    tradesToday: number;
    pnlToday: number;
  };
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  token?: string;
};

export function getApiBaseUrl() {
  return localStorage.getItem(API_BASE_STORAGE_KEY) ?? DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(API_BASE_STORAGE_KEY, url.replace(/\/$/, ''));
}

export function resetApiSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function login() {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    }
  });
}

async function register() {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    }
  });
}

function saveTokens(tokens: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_STORAGE_KEY, tokens.refreshToken);
}

export async function getAccessToken() {
  const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (existingToken) {
    return existingToken;
  }

  try {
    const tokens = await register();
    saveTokens(tokens);
    return tokens.accessToken;
  } catch {
    const tokens = await login();
    saveTokens(tokens);
    return tokens.accessToken;
  }
}

export const casperApi = {
  async getPortfolio(token: string) {
    return request<{ portfolio: Portfolio }>('/portfolio', { token });
  },
  async getTrades(token: string) {
    return request<{ trades: Trade[] }>('/trades', { token });
  },
  async getMarket(token: string, symbol: string) {
    return request<{ market: Market }>(`/market?symbol=${encodeURIComponent(symbol)}`, { token });
  },
  async getPairs(token: string) {
    return request<{ pairs: string[] }>('/market/pairs', { token });
  },
  async getSettings(token: string) {
    return request<{ settings: Settings }>('/settings', { token });
  },
  async updateSettings(token: string, settings: Partial<Settings>) {
    return request<{ settings: Settings }>('/settings', {
      method: 'PUT',
      token,
      body: settings
    });
  },
  async getBotStatus(token: string) {
    return request<BotStatus>('/bot/status', { token });
  },
  async startBot(token: string) {
    return request<{ status: string }>('/bot/start', { method: 'POST', token });
  },
  async stopBot(token: string) {
    return request<{ status: string }>('/bot/stop', { method: 'POST', token });
  },
  async emergencyStop(token: string) {
    return request<{ status: string }>('/bot/emergency-stop', {
      method: 'POST',
      token,
      body: { reason: 'Triggered from Casper frontend' }
    });
  },
  marketStreamUrl(token: string, symbol: string) {
    const wsBaseUrl = getApiBaseUrl().replace(/^http/, 'ws');
    return `${wsBaseUrl}/ws/market?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
  }
};
