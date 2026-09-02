import { type PrismaClient } from "@generated/prisma/client.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";


const TEMPLATE_DB = getEnvOrThrow("TEMPLATE_DATABASE_PATH");
const TEST_DATABASES_DIR = path.dirname(TEMPLATE_DB);

// Wipes the per-file copies from the previous run. Creates the directory first
// so that a fresh clone, where it does not exist yet, is not a special case.
export const removeTestDatabases = () => {
    mkdirSync(TEST_DATABASES_DIR, { recursive: true });

    for (const file of readdirSync(TEST_DATABASES_DIR)) {
        rmSync(path.join(TEST_DATABASES_DIR, file));
    }
};

// Jest's globalSetup builds the template once per run, but scripts driven
// straight by tsx (the benchmark) have no such hook and must ask for it.
export const createTemplateDatabase = () => {
    mkdirSync(TEST_DATABASES_DIR, { recursive: true });
    execSync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: `file:./${TEMPLATE_DB}` },
        stdio: "ignore",
    });
};

// Order matters: removeTestDatabases wipes the whole TEST_DATABASES_DIR, which
// is also where the template lives — building the template first would just
// get deleted.
export const setupTemplateDb = () => {
    removeTestDatabases();
    createTemplateDatabase();
};

export const clearTestDatabase = async (prisma: PrismaClient) => {
    await prisma.url.deleteMany();
    await prisma.user.deleteMany();
};

const buildTestConnectionString = (testFileUrl: string) => {
    const rawConnectionString = getEnvOrThrow("DATABASE_URL");

    const testName = path
        .relative(process.cwd(), fileURLToPath(testFileUrl))
        .replace(/(\.test)?\.ts$/, "")
        .replaceAll(path.sep, "-");
    const connectionString = rawConnectionString.replace("{TEST_NAME}", testName);

    return connectionString;
};

const createTestDbFromTemplate = (connectionString: string) => {
    copyFileSync(TEMPLATE_DB, connectionString.replace("file:", ""));
};

export const setupTestDb = (testFileUrl: string) => {
    const connectionString = buildTestConnectionString(testFileUrl);
    createTestDbFromTemplate(connectionString);

    return connectionString;
};