import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getExchangeClient, getUserExchange } from "../infrastructure/exchange/exchange.js";
import { verifyAccessToken } from "../utils/jwt.js";

const streamQuerySchema = z.object({
  symbol: z
    .string()
    .min(3)
    .max(20)
    .optional()
    .default("BTCUSDT")
    .transform((value) => value.toUpperCase()),
  token: z.string().optional()
});

export async function registerMarketStream(app: FastifyInstance) {
  await app.register(websocket);

  app.get("/ws/market", { websocket: true }, (socket, request) => {
    const parsed = streamQuerySchema.safeParse(request.query);
    const symbol = parsed.success ? parsed.data.symbol : "BTCUSDT";
    const authorization = request.headers.authorization;
    const headerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const token = parsed.success ? (parsed.data.token ?? headerToken) : headerToken;

    let userId: string | undefined;

    try {
      if (!token) {
        socket.close(1008, "Missing token");
        return;
      }

      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        socket.close(1008, "Invalid token");
        return;
      }

      throw error;
    }

    const sendTicker = async () => {
      try {
        const exchange = userId ? await getUserExchange(app.prisma, userId) : "BYBIT";
        const client = getExchangeClient(exchange);
        const ticker = await client.getTicker(symbol);
        socket.send(JSON.stringify(ticker));
      } catch (error) {
        app.log.error({ err: error, symbol }, "market websocket tick failed");
        socket.send(JSON.stringify({ type: "error", message: "Failed to fetch market data" }));
      }
    };

    const interval = setInterval(() => {
      void sendTicker();
    }, 30_000);

    void sendTicker();

    socket.on("close", () => {
      clearInterval(interval);
    });
  });
}
