import type { Queue } from "bullmq";
import type { FastifyReply, FastifyRequest } from "fastify";
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
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<unknown>;
  }

  interface FastifyRequest {
    auth: AuthenticatedUser;
  }
}
