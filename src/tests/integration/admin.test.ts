import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@src/tests/mocks/fastify.js";
import buildPrismaClient from '@lib/prisma.js';
import { allowedRolesForRoute } from "@src/config/authorization.js";
import { userExamples } from '@src/tests/fixtures/urls.js';
import {
    buildTestSchema,
    clearTestSchema,
    closeDbConnections,
    getTestSchemaNameFromFileUrl,
    testDbConnectionString,
} from '@src/tests/helpers/db.js';
import { generateTokenForUserId } from '@src/tests/helpers/auth.js';


const schema = getTestSchemaNameFromFileUrl(import.meta.url);

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

beforeAll(async () => {
    const testSchema = await buildTestSchema(schema);
    prisma = buildPrismaClient({ testDbConnectionString, testSchema });
    app = buildFastify(
        {logger: false},
        {prisma: prisma},
        pluginsWithoutRateLimit,
    );
});

afterAll(async () => {
    await prisma.$disconnect();
    await closeDbConnections();
});

afterEach(async () => {
    await clearTestSchema(schema);
});

describe('GET /admin/dummy', () => {
    test('returns 400 when the authorization header is missing', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/admin/dummy',
        });
        expect(response.statusCode).toBe(400);
    });

    test('returns 404 for non-existent user', async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const fakeUserToken = await generateTokenForUserId(user.id + 1);

        const response = await app.inject({
            method: 'GET',
            url: '/admin/dummy',
            headers: {
                authorization: `Bearer ${fakeUserToken}`,
            },
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'User not found' });
    });

    test('returns 403 for a user without the admin role', async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'GET',
            url: '/admin/dummy',
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        expect(response.statusCode).toBe(403);
    });

    test('returns 200 for an admin user', async () => {
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, role: allowedRolesForRoute.admin[0]! },
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'GET',
            url: '/admin/dummy',
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({ ok: true });
    });
});
