export function parseWithSchema(schema, value) {
    return schema.parse(value);
}
export function sendValidationError(reply, error) {
    return reply.status(400).send({
        message: "Validation failed",
        issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
        }))
    });
}
