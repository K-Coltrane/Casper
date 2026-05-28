import type { PrismaClient } from "@prisma/client";
import { bybitClient } from "../bybit/client.js";
import { coinbaseClient } from "../coinbase/client.js";

export type ExchangeId = "BYBIT" | "COINBASE";

export function getExchangeClient(exchange: ExchangeId) {
  return exchange === "COINBASE" ? coinbaseClient : bybitClient;
}

export async function getUserExchange(prisma: PrismaClient, userId: string): Promise<ExchangeId> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const exchange = settings?.exchange?.toUpperCase();
  return exchange === "COINBASE" ? "COINBASE" : "BYBIT";
}

