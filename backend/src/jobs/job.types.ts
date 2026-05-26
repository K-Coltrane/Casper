import type { MarketTicker } from "../infrastructure/bybit/client.js";
import type { TradeSignal } from "../engine/signal.engine.js";

export type MarketJobData = {
  userId?: string;
  symbol: string;
};

export type SignalJobData = {
  userId?: string;
  marketData: MarketTicker;
};

export type RiskJobData = {
  userId: string;
  marketData: MarketTicker;
  signal: Exclude<TradeSignal, "HOLD">;
};

export type ExecutionJobData = RiskJobData & {
  quantity: number;
};
