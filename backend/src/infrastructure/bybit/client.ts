import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";

export type MarketTicker = {
  symbol: string;
  price: number;
  volume: number;
  volatility: number;
  changePercent: number;
  timestamp: string;
};

export type OrderRequest = {
  apiKey: string;
  secret: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  idempotencyKey?: string;
};

export type OrderConfirmation = {
  exchange: "BYBIT";
  orderId: string;
  status: "PAPER_FILLED" | "SUBMITTED";
};

export class BybitClient {
  listConfiguredPairs() {
    return env.TRADING_PAIRS.split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter((symbol) => symbol.length > 0);
  }

  async listSpotSymbols(): Promise<string[]> {
    if (env.MARKET_DATA_MODE === "mock") {
      return this.listConfiguredPairs();
    }

    const url = new URL("/v5/market/instruments-info", env.BYBIT_BASE_URL);
    url.searchParams.set("category", "spot");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bybit instruments request failed with ${response.status}`);
    }

    const body = (await response.json()) as {
      result?: { list?: Array<{ symbol?: string; status?: string; quoteCoin?: string }> };
    };

    const symbols = (body.result?.list ?? [])
      .map((item) => item.symbol)
      .filter((symbol): symbol is string => Boolean(symbol))
      .map((symbol) => symbol.toUpperCase());

    return Array.from(new Set(symbols));
  }

  async getTicker(symbol: string): Promise<MarketTicker> {
    if (env.MARKET_DATA_MODE === "mock") {
      return this.getMockTicker(symbol);
    }

    const url = new URL("/v5/market/tickers", env.BYBIT_BASE_URL);
    url.searchParams.set("category", "spot");
    url.searchParams.set("symbol", symbol);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bybit ticker request failed with ${response.status}`);
    }

    const body = (await response.json()) as {
      result?: {
        list?: Array<{
          symbol: string;
          lastPrice: string;
          volume24h: string;
          highPrice24h?: string;
          lowPrice24h?: string;
          price24hPcnt?: string;
        }>;
      };
    };

    const ticker = body.result?.list?.[0];
    if (!ticker) {
      throw new Error(`No Bybit ticker returned for ${symbol}`);
    }

    const price = Number(ticker.lastPrice);
    const high = Number(ticker.highPrice24h ?? ticker.lastPrice);
    const low = Number(ticker.lowPrice24h ?? ticker.lastPrice);
    const volatility = price > 0 ? Math.abs(high - low) / price : 0;

    return {
      symbol: ticker.symbol,
      price,
      volume: Number(ticker.volume24h),
      volatility,
      changePercent: Number(ticker.price24hPcnt ?? 0) * 100,
      timestamp: new Date().toISOString()
    };
  }

  private getMockTicker(symbol: string): MarketTicker {
    const normalizedSymbol = symbol.toUpperCase();
    const seed = Array.from(normalizedSymbol).reduce((total, char) => total + char.charCodeAt(0), 0);
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const wave = Math.sin((minuteBucket + seed) / 10);
    const basePrice = normalizedSymbol.startsWith("BTC")
      ? 68_000
      : normalizedSymbol.startsWith("ETH")
        ? 3_500
        : 150;
    const price = Number((basePrice * (1 + wave * 0.01)).toFixed(2));
    const changePercent = Number((wave * 2).toFixed(2));

    return {
      symbol: normalizedSymbol,
      price,
      volume: Number((1_000_000 + Math.abs(wave) * 500_000).toFixed(2)),
      volatility: Number((Math.abs(wave) * 0.05).toFixed(4)),
      changePercent,
      timestamp: new Date().toISOString()
    };
  }

  async placeMarketOrder(order: OrderRequest): Promise<OrderConfirmation> {
    if (!env.BYBIT_ENABLE_LIVE_TRADING) {
      return {
        exchange: "BYBIT",
        orderId: `paper_${Date.now()}`,
        status: "PAPER_FILLED"
      };
    }

    const timestamp = Date.now().toString();
    const body = JSON.stringify({
      category: "spot",
      symbol: order.symbol,
      side: order.side === "BUY" ? "Buy" : "Sell",
      orderType: "Market",
      qty: order.quantity.toString(),
      orderLinkId: order.idempotencyKey
    });
    const signature = createHmac("sha256", order.secret)
      .update(`${timestamp}${order.apiKey}5000${body}`)
      .digest("hex");

    const response = await fetch(new URL("/v5/order/create", env.BYBIT_BASE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BAPI-API-KEY": order.apiKey,
        "X-BAPI-SIGN": signature,
        "X-BAPI-SIGN-TYPE": "2",
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000"
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Bybit order request failed with ${response.status}`);
    }

    const result = (await response.json()) as { result?: { orderId?: string } };
    return {
      exchange: "BYBIT",
      orderId: result.result?.orderId ?? `submitted_${timestamp}`,
      status: "SUBMITTED"
    };
  }
}

export const bybitClient = new BybitClient();
