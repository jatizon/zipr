import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import { MultiLevelCacheManager } from "@src/cache/manager.js";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@tests/mocks/fastify.js";
import buildPrismaClient from '@src/clients/prisma.js';
import { verifyPasswordHash, getValidatedPayload } from '@src/helpers/auth.js';
import { invalidEmails, userExamples, validEmails } from '@tests/fixtures/urls.js';
import { clearTestSchema, buildTestSchema } from '@tests/helpers/db.js';
import { testDbConnectionString } from '@tests/helpers/db.js';
import { closeDbConnections } from '@tests/helpers/db.js';
import { getTestSchemaNameFromFileUrl } from '@tests/helpers/db.js';

const validEmail = validEmails[0]!;
const invalidEmail = invalidEmails[0]!;
const password = 'correct-horse-battery-staple';

const schema = getTestSchemaNameFromFileUrl(import.meta.url);

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

beforeAll(async () => {
    const testSchema = await buildTestSchema(schema);
    prisma = buildPrismaClient({ connectionString: testDbConnectionString, schema: testSchema });
    app = buildFastify(
        { logger: false },
        { prisma: prisma, cacheManager: new MultiLevelCacheManager([]) },
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

describe('POST /user/create', () => {
    test('returns 400 for an invalid email', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: {
                email: invalidEmail,
                password,
            },
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid email' });

        expect(await prisma.user.count()).toBe(0);
    });

    describe('schema', () => {
        test('returns 400 when the email field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/create',
                payload: {
                    password,
                },
            });
            expect(response.statusCode).toBe(400);
            expect(response.json()).toMatchObject({ message: "body must have required property 'email'" });

            expect(await prisma.user.count()).toBe(0);
        });

        test('returns 400 when the password field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/create',
                payload: {
                    email: validEmail,
                },
            });
            expect(response.statusCode).toBe(400);
            expect(response.json()).toMatchObject({ message: "body must have required property 'password'" });

            expect(await prisma.user.count()).toBe(0);
        });

        test('returns 400 when email is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/create',
                payload: {
                    email: {},
                    password,
                },
            });
            expect(response.statusCode).toBe(400);

            expect(await prisma.user.count()).toBe(0);
        });

        test('returns 400 when password is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/create',
                payload: {
                    email: validEmail,
                    password: {},
                },
            });
            expect(response.statusCode).toBe(400);

            expect(await prisma.user.count()).toBe(0);
        });
    });

    test('returns 409 for already existing user email', async () => {
        const existing = userExamples[0]!;

        const first = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: existing.email, password },
        });
        expect(first.statusCode).toBe(201);

        const response = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: {
                email: existing.email,
                password,
            },
        });
        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({ message: 'User already exists' });

        const stored = await prisma.user.findMany({
            where: { email: existing.email },
        });
        expect(stored).toHaveLength(1);
    });

    test('successfully creates a new user', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: {
                email: validEmail,
                password,
            },
        });
        expect(response.statusCode).toBe(201);

        const { id } = response.json();
        expect(typeof id).toBe('number');

        const stored = await prisma.user.findUniqueOrThrow({
            where: { id },
        });
        expect(stored.email).toBe(validEmail);

        expect(stored.passwordHash).not.toBe(password);
        expect(await verifyPasswordHash(password, stored.passwordHash)).toBe(true);
    });
});

describe('POST /user/login', () => {
    describe('schema', () => {
        test('returns 400 when the email field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    password,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when the password field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    email: validEmail,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when email is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    email: {},
                    password,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when password is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    email: validEmail,
                    password: {},
                },
            });
            expect(response.statusCode).toBe(400);
        });
    });

    test('returns 401 for a non-existent user email', async () => {
        await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: validEmail, password },
        });

        const response = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: {
                email: validEmails[1]!,
                password,
            },
        });
        expect(response.statusCode).toBe(401);
    });

    test('returns 401 for an incorrect password', async () => {
        await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: validEmail, password },
        });

        const response = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: {
                email: validEmail,
                password: `${password}-wrong`,
            },
        });
        expect(response.statusCode).toBe(401);
    });

    test('returns a valid token for the correct credentials', async () => {
        const created = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: { email: validEmail, password },
        });
        const { id } = created.json();

        const response = await app.inject({
            method: 'POST',
            url: '/user/login',
            payload: { email: validEmail, password },
        });
        expect(response.statusCode).toBe(200);

        const payload = await getValidatedPayload(response.body);
        expect(payload).not.toBeNull();
        expect(payload?.sub).toBe(String(id));
    });
});
