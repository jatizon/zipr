import { afterAll, beforeAll, afterEach, describe, test } from "@jest/globals";
import autocannon from "autocannon";
import { randomUUID } from "crypto";
import buildFastify from "@src/build.js";
import buildPrismaClient from "@lib/prisma.js";
import startServer from "@src/server.js";
import { clearTestDatabase, setupTestDb } from "../helpers/db.js";
import { resolvePath } from "../helpers/path.js";
import createAutocannonRunner from "./autocannonWrapper.js";


const SECONDS = 1000;
const defaultTimeout = 20 * SECONDS;

const connectionString = setupTestDb(import.meta.url);
const prisma = buildPrismaClient(connectionString);
const app = buildFastify(
    {prisma: prisma},
    {logger: false},
);

const autocannonRunner = createAutocannonRunner({
    baseUrl: 'http://localhost:3000',
    connections: 10,
    duration: 10,
    workers: 1,
});

beforeAll(async () => {
    await startServer(app);
});

afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
});

afterEach(async () => {
    await clearTestDatabase(prisma);
});

describe('POST /shorten/auto', () => {
    test('creates many auto-shortened urls for the same user', async () => {
        const userResponse = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: `${randomUUID()}@example.com` },
        });
        const userResponseJson = userResponse.json();
        const ownerId = userResponseJson.id;

        const result = await autocannonRunner.post({
            path: '/shorten/auto',
            headers: { 'content-type': 'application/json' },
            initialContext: { ownerId },
            requests: [{
                setupRequest: resolvePath('./workerRequestHelpers/shorten/generateBodyWithRandomLongUrl.cjs', import.meta.url),
            }],
        });

        console.log(autocannon.printResult(result));
    }, defaultTimeout);
});
