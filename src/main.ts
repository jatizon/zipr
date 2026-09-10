import "dotenv/config";
import buildFastify, { plugins } from "@src/build.js";
import startServer from "@src/server.js";
import buildPrismaClient from "@lib/prisma.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { buildConnectionString } from "@src/helpers/db.js";


const connectionString = buildConnectionString({
    postgresUser: getEnvOrThrow("POSTGRES_USER"),
    postgresPassword: getEnvOrThrow("POSTGRES_PASSWORD"),
    postgresHost: getEnvOrThrow("POSTGRES_HOST"),
    postgresPort: Number(getEnvOrThrow("POSTGRES_PORT")),
    postgresDb: getEnvOrThrow("POSTGRES_DB")
});
const prisma = buildPrismaClient({
    testDbConnectionString: connectionString,
});
const app = buildFastify(
    {logger: true},
    {prisma: prisma},
    plugins,
);

startServer(app);



