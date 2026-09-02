import { type FastifyInstance } from "fastify";
import "dotenv/config";
import { getEnvOrThrow } from "./config/env.js";


const startServer = async (fastify: FastifyInstance) => {
  const port = Number(getEnvOrThrow("PORT"));

  try {
    await fastify.listen({ port: port});
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export default startServer;