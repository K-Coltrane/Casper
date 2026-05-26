import type { FastifyServerOptions } from "fastify";
import { env } from "./env.js";

export const loggerOptions: FastifyServerOptions["logger"] =
  env.NODE_ENV === "development"
    ? {
        level: "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        },
        redact: ["req.headers.authorization", "apiKey", "secret", "*.apiKey", "*.secret"]
      }
    : {
        level: "info",
        redact: ["req.headers.authorization", "apiKey", "secret", "*.apiKey", "*.secret"]
      };
