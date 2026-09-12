import { buildPostgresPool } from "@src/clients/postgres.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPostgresConnectionString } from "@src/persistence/db.js";
import { resolvePathFromPackageRoot } from "./path.js";

 
const ADMIN_DB = getEnvOrThrow("ADMIN_POSTGRES_DB");
const TEST_DB = getEnvOrThrow("POSTGRES_DB");

const adminDbConnectionString = buildPostgresConnectionString({
    postgresUser: getEnvOrThrow("POSTGRES_USER"),
    postgresPassword: getEnvOrThrow("POSTGRES_PASSWORD"),
    postgresHost: getEnvOrThrow("POSTGRES_HOST"),
    postgresPort: Number(getEnvOrThrow("POSTGRES_PORT")),
    postgresDb: ADMIN_DB,
});

export const testDbConnectionString = buildPostgresConnectionString({
    postgresUser: getEnvOrThrow("POSTGRES_USER"),
    postgresPassword: getEnvOrThrow("POSTGRES_PASSWORD"),
    postgresHost: getEnvOrThrow("POSTGRES_HOST"),
    postgresPort: Number(getEnvOrThrow("POSTGRES_PORT")),
    postgresDb: TEST_DB,
});

const loadAllMigrationsSql = (migrationsDir: string): string =>
    readdirSync(migrationsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory()) // exclui migration_lock.toml
        .map((entry) => entry.name)
        .sort()
        .map((dir) => readFileSync(path.join(migrationsDir, dir, "migration.sql"), "utf8"))
        .join("\n");

const MIGRATIONS_DIR = resolvePathFromPackageRoot("prisma/migrations");
const MIGRATIONS_SQL = loadAllMigrationsSql(MIGRATIONS_DIR);

const postgresAdmin = buildPostgresPool(adminDbConnectionString);
const postgresTest = buildPostgresPool(testDbConnectionString);

export const getTestSchemaNameFromFileUrl = (testFileUrl: string) => {
    return path
        .relative(process.cwd(), fileURLToPath(testFileUrl))
        .replace(/(\.test)?\.ts$/, "")
        .replaceAll(path.sep, "_");
};

export const createTestDb = async () => {
    if (postgresAdmin.ended) return;

    await postgresAdmin.query(`
        DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE);
    `);

    await postgresAdmin.query(`
        CREATE DATABASE ${TEST_DB};
    `);
};

export const dropTestDb = async () => {
    if (postgresAdmin.ended) return;

    await postgresAdmin.query(`
        DROP DATABASE IF EXISTS ${TEST_DB};
    `);
};

const buildTestSchemaFromMigrations = async (testSchema: string) => {
    await postgresTest.query(`
        DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;
    `);

    await postgresTest.query(`
        CREATE SCHEMA "${testSchema}";
        SET search_path TO "${testSchema}";
        ${MIGRATIONS_SQL}
    `);
};

export const clearTestSchema = async (schema: string) => {
    const { rows } = await postgresTest.query<{ table_name: string }>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${schema}'
            AND table_type = 'BASE TABLE'
            AND table_name <> '_prisma_migrations';
    `);

    const tables = rows.map(({ table_name }) => `"${schema}"."${table_name}"`);

    if (tables.length > 0) {
        try {
            await postgresTest.query(`
                TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY;
            `);
        } catch (error) {
            console.dir(error, { depth: null });
            throw error;
        }
            }
};

export const buildTestSchema = async (schema: string) => {
    await buildTestSchemaFromMigrations(schema);

    return schema;
};

export const closeDbConnections = async () => {
    await postgresAdmin.end();
    await postgresTest.end();
};