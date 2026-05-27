export const metricsRoutes = async (app) => {
    app.get("/metrics", { preHandler: app.authenticate }, async () => {
        const [market, signal, risk, execution] = await Promise.all([
            app.queues.marketQueue.getJobCounts(),
            app.queues.signalQueue.getJobCounts(),
            app.queues.riskQueue.getJobCounts(),
            app.queues.executionQueue.getJobCounts()
        ]);
        return {
            uptimeSeconds: process.uptime(),
            memory: process.memoryUsage(),
            queues: {
                market,
                signal,
                risk,
                execution
            },
            timestamp: new Date().toISOString()
        };
    });
};
