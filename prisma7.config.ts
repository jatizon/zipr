import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getEnvOrThrow } from "./src/config/env.js";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getEnvOrThrow("DATABASE_URL"),
  },
});
