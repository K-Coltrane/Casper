import { Queue } from "bullmq";
import { createRedisConnection } from "../infrastructure/redis/client.js";
export const queueNames = {
    market: "marketQueue",
    signal: "signalQueue",
    risk: "riskQueue",
    execution: "executionQueue"
};
export function createQueues() {
    const connection = createRedisConnection();
    return {
        connection,
        queues: {
            marketQueue: new Queue(queueNames.market, { connection }),
            signalQueue: new Queue(queueNames.signal, { connection }),
            riskQueue: new Queue(queueNames.risk, { connection }),
            executionQueue: new Queue(queueNames.execution, { connection })
        }
    };
}
