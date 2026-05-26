import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";

export type MarketTicker = {
  symbol: string;
  price: number;
  volume: number;
  volatility: number;
};

export type OrderRequest = {
  apiKey: string;
  secret: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
};

export type OrderConfirmation = {
  exchange: "BYBIT";
  orderId: string;
  status: "PAPER_FILLED" | "SUBMITTED";
};

export class BybitClient {
  async getTicker(symbol: string): Promise<MarketTicker> {
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
      volatility
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
      qty: order.quantity.toString()
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
