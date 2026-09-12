import { afterAll, beforeAll, beforeEach, afterEach, describe, test } from "@jest/globals";
import { type Redis } from "ioredis";
import autocannon from "autocannon";
import buildFastify, { plugins, type TypeBoxFastifyInstance } from "@src/build.js";
import buildPrismaClient from "@src/clients/prisma.js";
import startServer from "@src/server.js";
import { clearTestSchema, buildTestSchema, testDbConnectionString, closeDbConnections } from "@src/tests/helpers/db.js";
import { resolvePathFromUrl, saveObjectIntoFile } from "@src/tests/helpers/path.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { testConfigs, type TestConfig } from "./testConfigs.js";
import { getTestSchemaNameFromFileUrl } from "@src/tests/helpers/db.js";
import { userExamples } from "@src/tests/fixtures/urls.js";
import { generateTokenForUserId } from "@src/tests/helpers/auth.js";
import { allowedTiersForRoute } from "@src/config/authorization.js";


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
    prisma = buildPrismaClient({ connectionString: testDbConnectionString, schema });
    app = buildFastify(
        { logger: false },
        { prisma: prisma, redis: {} as unknown as Redis },
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
        const user = await prisma.user.create({ data: userExamples[0]! });
        const token = await generateTokenForUserId(user.id);

        const result = await autocannon({
            url: 'http://localhost:3000/shorten/auto',
            method: 'POST',
            ...testConfig,
            headers: { 'content-type': 'application/json' },
            initialContext: { token },
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
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
        });
        const token = await generateTokenForUserId(user.id);

        const result = await autocannon({
            url: 'http://localhost:3000/shorten/custom',
            method: 'POST',
            ...testConfig,
            headers: { 'content-type': 'application/json' },
            initialContext: { token },
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
