import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { MarketTicker, OrderConfirmation, OrderRequest } from "../bybit/client.js";

type CoinbaseMarketTradesResponse = {
  trades?: Array<{
    price?: string;
    size?: string;
    time?: string;
  }>;
  best_bid?: string;
  best_ask?: string;
  volume_24_h?: string;
  price?: string;
};

type CoinbaseCreateOrderResponse =
  | { success: true; success_response: { order_id: string } }
  | { success: false; error_response?: unknown };

function toCoinbaseProductId(symbol: string) {
  const normalized = symbol.toUpperCase();
  const quote = env.COINBASE_QUOTE_CURRENCY;

  if (normalized.endsWith("USDT")) {
    const base = normalized.slice(0, -4);
    return `${base}-${quote}`;
  }

  if (normalized.includes("-")) {
    return normalized;
  }

  return `${normalized}-${quote}`;
}

function buildRestJwt(method: "GET" | "POST", path: string, apiKey: string, privateKeyPem: string) {
  const host = new URL(env.COINBASE_BASE_URL).host;
  const jwtUri = `${method} ${host}${path}`;

  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString("hex");

  return jwt.sign(
    {
      iss: "cdp",
      sub: apiKey,
      nbf: now,
      exp: now + 120,
      uri: jwtUri
    },
    privateKeyPem,
    {
      algorithm: "ES256",
      header: {
        kid: apiKey,
        nonce
      }
    }
  );
}

export class CoinbaseClient {
  listConfiguredPairs() {
    return env.TRADING_PAIRS.split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter((symbol) => symbol.length > 0);
  }

  async getTicker(symbol: string): Promise<MarketTicker> {
    if (env.MARKET_DATA_MODE === "mock") {
      return this.getMockTicker(symbol);
    }

    const productId = toCoinbaseProductId(symbol);
    const url = new URL(`/api/v3/brokerage/market/products/${encodeURIComponent(productId)}/ticker`, env.COINBASE_BASE_URL);
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        "cache-control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`Coinbase ticker request failed with ${response.status}`);
    }

    const body = (await response.json()) as CoinbaseMarketTradesResponse;
    const lastTrade = body.trades?.[0];
    const price = Number(lastTrade?.price ?? body.price ?? 0);
    const volume = Number(body.volume_24_h ?? 0);

    return {
      symbol: symbol.toUpperCase(),
      price,
      volume,
      volatility: 0,
      changePercent: 0,
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
      volume: Number((750_000 + Math.abs(wave) * 400_000).toFixed(2)),
      volatility: Number((Math.abs(wave) * 0.05).toFixed(4)),
      changePercent,
      timestamp: new Date().toISOString()
    };
  }

  async placeMarketOrder(order: OrderRequest): Promise<OrderConfirmation> {
    if (!env.COINBASE_ENABLE_LIVE_TRADING) {
      return {
        exchange: "COINBASE",
        orderId: `paper_${Date.now()}`,
        status: "PAPER_FILLED"
      };
    }

    const productId = toCoinbaseProductId(order.symbol);
    const path = "/api/v3/brokerage/orders";
    const authorization = buildRestJwt("POST", path, order.apiKey, order.secret);
    const body = JSON.stringify({
      client_order_id: order.idempotencyKey ?? `casper_${Date.now()}`,
      product_id: productId,
      side: order.side,
      order_configuration: {
        market_market_ioc: {
          base_size: order.quantity.toString()
        }
      }
    });

    const response = await fetch(new URL(path, env.COINBASE_BASE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authorization}`
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Coinbase order request failed with ${response.status}`);
    }

    const result = (await response.json()) as CoinbaseCreateOrderResponse;
    if (!result.success) {
      throw new Error("Coinbase order failed");
    }

    return {
      exchange: "COINBASE",
      orderId: result.success_response.order_id,
      status: "SUBMITTED"
    };
  }
}

export const coinbaseClient = new CoinbaseClient();

