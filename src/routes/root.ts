import { type FastifyInstance } from "fastify";
import Type from "typebox";


export default async function rootRoutes(
    fastify: FastifyInstance,
) {
    fastify.get("/health", {
        schema: {
            tags: ["root"],
            summary: "Health check",
            response: { 200: Type.String() },
        },
    }, () => "healthy");
}