import type { Queue } from "bullmq";
import type { FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AppQueues = {
  marketQueue: Queue;
  signalQueue: Queue;
  riskQueue: Queue;
  executionQueue: Queue;
};

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    queues: AppQueues;
    authenticate(request: FastifyRequest): Promise<void>;
  }

  interface FastifyRequest {
    auth: AuthenticatedUser;
  }
}
