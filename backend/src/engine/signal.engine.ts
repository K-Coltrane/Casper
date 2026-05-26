import type { MarketTicker } from "../infrastructure/bybit/client.js";

export type TradeSignal = "BUY" | "SELL" | "HOLD";

export function calculateMomentum(marketData: MarketTicker) {
  if (marketData.price <= 0) {
    return 0;
  }

  const volumeScore = Math.min(marketData.volume / 1_000_000_000, 1);
  const volatilityScore = Math.min(marketData.volatility, 1);

  return Number((volumeScore - volatilityScore).toFixed(4));
}

export function generateSignal(marketData: MarketTicker): TradeSignal {
  const momentum = calculateMomentum(marketData);

  if (momentum > 0.8) return "BUY";
  if (momentum < -0.8) return "SELL";
  return "HOLD";
}
