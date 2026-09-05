import { afterAll, beforeAll, beforeEach, afterEach, describe, test } from "@jest/globals";
import autocannon from "autocannon";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import buildPrismaClient from "@lib/prisma.js";
import startServer from "@src/server.js";
import { clearTestSchema, buildTestSchema, testDbConnectionString, closeDbConnections } from "@src/tests/helpers/db.js";
import { resolvePathFromUrl, saveObjectIntoFile } from "@src/tests/helpers/path.js";
import { getEnvOrThrow } from "@src/config/env.js";
import { testConfigs, type TestConfig } from "./testConfigs.js";
import { getTestSchemaNameFromFileUrl } from "@src/tests/helpers/db.js";
import { encodeBase62 } from "@src/helpers/base62Codec.js";
import { ShorteningTypes } from "@src/interfaces.js";
import { userExamples, validUrls, nonCollidingSlugs } from "@src/tests/fixtures/urls.js";


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
        {prisma: prisma},
        {logger: false},
    );

    await startServer(app);
});

afterEach(async () => {
    await app.close();
    await prisma.$disconnect();
    await clearTestSchema(schema);
}, defaultTimeout);

type TestResult = TestConfig & autocannon.Result;

describe('GET /a/:shortUrl', () => {
    const testResults: TestResult[] = [];
    let completedCount = 0;

    afterAll(async () => {
        console.log("Performance Test Results (redirect auto):");
        const resultsFolder = resolvePathFromUrl(RESULTS_RELATIVE_FOLDER, import.meta.url);
        await saveObjectIntoFile(testResults, resultsFolder);
    });

    test.each(testConfigs)('redirects an auto-shortened url', async (testConfig) => {
        const user = await prisma.user.create({ data: userExamples[0]! });
        const created = await prisma.url.create({
            data: {
                ownerId: user.id,
                longUrl: validUrls[0]!,
                shorteningType: ShorteningTypes.Auto,
            },
        });
        const url = await prisma.url.update({
            where: { id: created.id },
            data: { shortUrl: encodeBase62(created.id) },
        });

        const result = await autocannon({
            url: `http://localhost:3000/a/${url.shortUrl}`,
            method: 'GET',
            ...testConfig,
        });

        testResults.push({ ...testConfig,...result });

        completedCount++;
        const percentDone = ((completedCount / testConfigs.length) * 100).toFixed(0);
        console.log(`Progress: ${completedCount}/${testConfigs.length} (${percentDone}%)`);
    }, defaultTimeout);
});

describe('GET /:shortUrl', () => {
    const testResults: TestResult[] = [];
    let completedCount = 0;

    afterAll(async () => {
        console.log("Performance Test Results (redirect custom):");
        const resultsFolder = resolvePathFromUrl(RESULTS_RELATIVE_FOLDER, import.meta.url);
        await saveObjectIntoFile(testResults, resultsFolder);
    });

    test.each(testConfigs)('redirects a custom-shortened url', async (testConfig) => {
        const user = await prisma.user.create({ data: userExamples[0]! });
        const slug = nonCollidingSlugs[0]!;
        await prisma.url.create({
            data: {
                ownerId: user.id,
                longUrl: validUrls[0]!,
                shortUrl: slug,
                shorteningType: ShorteningTypes.Custom,
            },
        });

        const result = await autocannon({
            url: `http://localhost:3000/${slug}`,
            method: 'GET',
            ...testConfig,
        });

        testResults.push({ ...testConfig,...result });

        completedCount++;
        const percentDone = ((completedCount / testConfigs.length) * 100).toFixed(0);
        console.log(`Progress: ${completedCount}/${testConfigs.length} (${percentDone}%)`);
    }, defaultTimeout);
});
