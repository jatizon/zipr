import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@src/tests/mocks/fastify.js";
import buildPrismaClient from '@lib/prisma.js';
import { verifyPasswordHash } from '@src/helpers/auth.js';
import { invalidEmails, userExamples, validEmails } from '@src/tests/fixtures/urls.js';
import { clearTestSchema, buildTestSchema } from '@src/tests/helpers/db.js';
import { testDbConnectionString } from '@src/tests/helpers/db.js';
import { closeDbConnections } from '@src/tests/helpers/db.js';
import { getTestSchemaNameFromFileUrl } from '@src/tests/helpers/db.js';

const validEmail = validEmails[0]!;
const invalidEmail = invalidEmails[0]!;
const password = 'correct-horse-battery-staple';

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
