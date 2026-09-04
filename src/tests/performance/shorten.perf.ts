import { afterAll, beforeAll, afterEach, describe, test } from "@jest/globals";
import autocannon from "autocannon";
import { randomUUID } from "crypto";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import buildPrismaClient from "@lib/prisma.js";
import startServer from "@src/server.js";
import { clearTestSchema, buildTestSchema, testDbConnectionString, closeDbConnections } from "../helpers/db.js";
import { resolvePathFromUrl } from "../helpers/path.js";
import createAutocannonRunner from "./autocannonWrapper.js";


const SECONDS = 1000;
const defaultTimeout = 20 * SECONDS;

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

const autocannonRunner = createAutocannonRunner({
    baseUrl: 'http://localhost:3000',
    connections: 200,
    duration: 3,
    workers: 1,
});

beforeAll(async () => {
    const testSchema = await buildTestSchema(import.meta.url);
    prisma = buildPrismaClient(testDbConnectionString, testSchema);
    app = buildFastify(
        {prisma: prisma},
        {logger: false},
    );
    await startServer(app);
});

afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await closeDbConnections();
});

afterEach(async () => {
    await clearTestSchema(import.meta.url);
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
                setupRequest: resolvePathFromUrl('./workerRequestHelpers/generateBodyWithRandomLongUrl.cjs', import.meta.url),
            }],
        });

        console.log(autocannon.printResult(result));
    }, defaultTimeout);
});
