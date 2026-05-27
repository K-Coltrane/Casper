export const usersRoutes = async (app) => {
    app.get("/me", { preHandler: app.authenticate }, async (request) => {
        const user = await app.prisma.user.findUniqueOrThrow({
            where: { id: request.auth.id },
            select: {
                id: true,
                email: true,
                createdAt: true,
                settings: true,
                portfolio: true
            }
        });
        return { user };
    });
};
