import type { PrismaClient, Trade } from "@prisma/client";

export type PortfolioSummary = {
  balance: number;
  pnlToday: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  openPositionValue: number;
  openPositions: Trade[];
};

function startOfUtcDay() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function positionValue(trade: Pick<Trade, "entryPrice" | "quantity">) {
  return trade.entryPrice * trade.quantity;
}

export async function calculatePortfolioSummary(
  prisma: PrismaClient,
  userId: string
): Promise<PortfolioSummary> {
  const [portfolio, openPositions, closedTrades, closedToday] = await Promise.all([
    prisma.portfolio.upsert({
      where: { userId },
      update: {},
      create: { userId }
    }),
    prisma.trade.findMany({
      where: { userId, status: "OPEN" },
      orderBy: { createdAt: "desc" }
    }),
    prisma.trade.findMany({
      where: { userId, status: "CLOSED" }
    }),
    prisma.trade.findMany({
      where: {
        userId,
        status: "CLOSED",
        closedAt: { gte: startOfUtcDay() }
      }
    })
  ]);

  const openPositionValue = openPositions.reduce(
    (total, trade) => total + positionValue(trade),
    0
  );
  const realizedPnL = closedTrades.reduce((total, trade) => total + (trade.pnl ?? 0), 0);
  const pnlToday = closedToday.reduce((total, trade) => total + (trade.pnl ?? 0), 0);

  const updated = await prisma.portfolio.update({
    where: { userId },
    data: {
      realizedPnL,
      unrealizedPnL: portfolio.unrealizedPnL,
      openPositionValue,
      pnlToday,
      totalPnL: realizedPnL + portfolio.unrealizedPnL
    }
  });

  return {
    balance: updated.balance,
    pnlToday: updated.pnlToday,
    totalPnL: updated.totalPnL,
    realizedPnL: updated.realizedPnL,
    unrealizedPnL: updated.unrealizedPnL,
    openPositionValue: updated.openPositionValue,
    openPositions
  };
}

export async function updatePortfolioAfterExecution(prisma: PrismaClient, userId: string) {
  return calculatePortfolioSummary(prisma, userId);
}
