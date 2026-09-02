import "dotenv/config";
import buildFastify from "@src/build.js";
import startServer from "@src/server.js";
import buildPrismaClient from "@lib/prisma.js";
import { getEnvOrThrow } from "@src/config/env.js";


const connectionString = getEnvOrThrow("DATABASE_URL");
const prisma = buildPrismaClient(connectionString);
const app = buildFastify(
    {prisma: prisma},
    {logger: true}
);

startServer(app);



