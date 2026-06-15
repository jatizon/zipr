import { type FastifyInstance } from "fastify";


export const startServer = async (fastify: FastifyInstance) => {
    try {
      await fastify.listen({ port: 3000 });
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
};