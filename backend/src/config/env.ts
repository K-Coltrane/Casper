import "dotenv/config";
import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .default("false")
  .transform((value) => value.toLowerCase() === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  FRONTEND_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  API_KEY_ENCRYPTION_SECRET: z.string().min(32),
  BYBIT_BASE_URL: z.string().url().default("https://api-testnet.bybit.com"),
  BYBIT_ENABLE_LIVE_TRADING: boolFromString,
  MARKET_DATA_MODE: z.enum(["mock", "bybit"]).default("mock"),
  TRADING_PAIRS: z.string().default("BTCUSDT,ETHUSDT,SOLUSDT")
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
