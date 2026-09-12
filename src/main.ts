import "dotenv/config";
import buildFastify, { plugins } from "@src/build.js";
import startServer from "@src/server.js";
import buildPrismaClient from "@src/clients/prisma.js";
import { buildRedisClient } from "@src/clients/redis.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { buildPostgresConnectionString } from "@src/persistence/db.js";
import { buildRedisConnectionString } from "@src/persistence/cache.js";


const connectionString = buildPostgresConnectionString({
    postgresUser: getEnvOrThrow("POSTGRES_USER"),
    postgresPassword: getEnvOrThrow("POSTGRES_PASSWORD"),
    postgresHost: getEnvOrThrow("POSTGRES_HOST"),
    postgresPort: Number(getEnvOrThrow("POSTGRES_PORT")),
    postgresDb: getEnvOrThrow("POSTGRES_DB")
});

const redisConnectionString = buildRedisConnectionString({
    redisPassword: getEnvOrThrow("REDIS_PASSWORD"),
    redisHost: getEnvOrThrow("REDIS_HOST"),
    redisPort: Number(getEnvOrThrow("REDIS_PORT")),
});

const prisma = buildPrismaClient({
    connectionString,
});
const redis = buildRedisClient(redisConnectionString);

const app = buildFastify(
    { logger: true },
    { prisma: prisma, redis: redis },
    plugins,
);

startServer(app);



