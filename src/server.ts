import { type FastifyInstance } from "fastify";
import "dotenv/config";
import { getEnvOrThrow } from "./config/env.js";


const startServer = async (fastify: FastifyInstance) => {
  const port = Number(getEnvOrThrow("API_PORT"));
  // 127.0.0.1 outside docker; docker-compose.yaml overrides it with 0.0.0.0, where the port mapping is what exposes the app.
  const host = getEnvOrThrow("API_HOST");

  try {
    await fastify.listen({ port, host });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export default startServer;