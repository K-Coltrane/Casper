import type { Portfolio, Settings, Trade } from "@prisma/client";

export type ProposedTrade = {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  entryPrice: number;
  quantity: number;
};

export type RiskContext = {
  settings: Settings;
  portfolio: Portfolio;
  tradesToday: number;
  openTrades: Pick<Trade, "entryPrice" | "quantity">[];
};

export type RiskResult = {
  allowed: boolean;
  reason?: string;
};

export function riskCheck(trade: ProposedTrade, context: RiskContext): RiskResult {
  const tradeSize = trade.entryPrice * trade.quantity;
  const maxTradeSize = context.portfolio.balance * context.settings.maxTradePercent;
  const openExposure = context.openTrades.reduce(
    (total, openTrade) => total + openTrade.entryPrice * openTrade.quantity,
    0
  );
  const maxDrawdown = context.portfolio.balance * (context.settings.maxDrawdownPercent / 100);

  if (context.portfolio.pnlToday <= -context.settings.dailyLossLimit) {
    return { allowed: false, reason: "Daily loss limit reached" };
  }

  if (context.tradesToday >= context.settings.maxTradesPerDay) {
    return { allowed: false, reason: "Max trades per day reached" };
  }

  if (maxTradeSize <= 0 || tradeSize > maxTradeSize) {
    return { allowed: false, reason: "Trade size exceeds max trade percentage" };
  }

  if (maxDrawdown > 0 && Math.abs(Math.min(context.portfolio.totalPnL, 0)) >= maxDrawdown) {
    return { allowed: false, reason: "Max drawdown protection triggered" };
  }

  if (openExposure + tradeSize > context.portfolio.balance) {
    return { allowed: false, reason: "Open exposure exceeds available balance" };
  }

  return { allowed: true };
}
