import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getEnvOrThrow } from "./src/config/env.js";
import { buildPostgresConnectionString } from "./src/persistence/db.js";

const connectionString = buildPostgresConnectionString({
  postgresUser: getEnvOrThrow("POSTGRES_USER"),
  postgresPassword: getEnvOrThrow("POSTGRES_PASSWORD"),
  postgresHost: getEnvOrThrow("POSTGRES_HOST"),
  postgresPort: Number(getEnvOrThrow("POSTGRES_PORT")),
  postgresDb: getEnvOrThrow("POSTGRES_DB"),
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: connectionString,
  },
});
