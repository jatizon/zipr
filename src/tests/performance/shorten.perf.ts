import { afterAll, beforeAll, beforeEach, afterEach, describe, test } from "@jest/globals";
import autocannon from "autocannon";
import { randomUUID } from "crypto";
import buildFastify, { plugins, type TypeBoxFastifyInstance } from "@src/build.js";
import buildPrismaClient from "@lib/prisma.js";
import startServer from "@src/server.js";
import { clearTestSchema, buildTestSchema, testDbConnectionString, closeDbConnections } from "@src/tests/helpers/db.js";
import { resolvePathFromUrl, saveObjectIntoFile } from "@src/tests/helpers/path.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { testConfigs, type TestConfig } from "./testConfigs.js";
import { getTestSchemaNameFromFileUrl } from "@src/tests/helpers/db.js";


const SECONDS = 1000;
const defaultTimeout = 20 * SECONDS;

const schema = getTestSchemaNameFromFileUrl(import.meta.url);
const RESULTS_RELATIVE_FOLDER = getEnvOrThrow("PERFORMANCE_RESULTS_RELATIVE_FOLDER");

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

beforeAll(async () => {
    const suiteCount = 2;
    const expectedRuntime = testConfigs.reduce((acc, config) => acc + config.duration, 0) * suiteCount;
    const maxRuntime = testConfigs.length * defaultTimeout * suiteCount / SECONDS;
    console.log(`Expected runtime: ${expectedRuntime} seconds, maximum: ${maxRuntime} seconds`);

    await buildTestSchema(schema);
});

afterAll(async () => {
    await closeDbConnections();
});

beforeEach(async () => {
    prisma = buildPrismaClient({ testDbConnectionString, testSchema: schema });
    app = buildFastify(
        {logger: false},
        {prisma: prisma},
        plugins,
    );

    await startServer(app);
});

afterEach(async () => {
    await app.close();
    await prisma.$disconnect();
    await clearTestSchema(schema);
}, defaultTimeout);

type TestResult = TestConfig & autocannon.Result;

describe('POST /shorten/auto', () => {
    const testResults: TestResult[] = [];
    let completedCount = 0;

    afterAll(async () => {
        console.log("Performance Test Results (auto):");
        const resultsFolder = resolvePathFromUrl(RESULTS_RELATIVE_FOLDER, import.meta.url);
        await saveObjectIntoFile(testResults, resultsFolder);
    });

    test.each(testConfigs)('creates many auto-shortened urls for the same user', async (testConfig) => {
        const userResponse = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: `${randomUUID()}@example.com` },
        });
        const userResponseJson = userResponse.json();
        const ownerId = userResponseJson.id;

        const result = await autocannon({
            url: 'http://localhost:3000/shorten/auto',
            method: 'POST',
            ...testConfig,
            headers: { 'content-type': 'application/json' },
            initialContext: { ownerId },
            requests: [{
                setupRequest: resolvePathFromUrl('./workerRequestHelpers/generateBodyWithRandomLongUrl.cjs', import.meta.url),
            }],
        });

        testResults.push({ ...testConfig,...result });

        completedCount++;
        const percentDone = ((completedCount / testConfigs.length) * 100).toFixed(0);
        console.log(`Progress: ${completedCount}/${testConfigs.length} (${percentDone}%)`);
    }, defaultTimeout);
});

describe('POST /shorten/custom', () => {
    const testResults: TestResult[] = [];
    let completedCount = 0;

    afterAll(async () => {
        console.log("Performance Test Results (custom):");
        const resultsFolder = resolvePathFromUrl(RESULTS_RELATIVE_FOLDER, import.meta.url);
        await saveObjectIntoFile(testResults, resultsFolder);
    });

    test.each(testConfigs)('creates many custom-shortened urls for the same user', async (testConfig) => {
        const userResponse = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: `${randomUUID()}@example.com` },
        });
        const userResponseJson = userResponse.json();
        const ownerId = userResponseJson.id;

        const result = await autocannon({
            url: 'http://localhost:3000/shorten/custom',
            method: 'POST',
            ...testConfig,
            headers: { 'content-type': 'application/json' },
            initialContext: { ownerId },
            requests: [{
                setupRequest: resolvePathFromUrl('./workerRequestHelpers/generateBodyWithRandomLongUrlAndSlug.cjs', import.meta.url),
            }],
        });

        testResults.push({ ...testConfig,...result });

        completedCount++;
        const percentDone = ((completedCount / testConfigs.length) * 100).toFixed(0);
        console.log(`Progress: ${completedCount}/${testConfigs.length} (${percentDone}%)`);
    }, defaultTimeout);
});
