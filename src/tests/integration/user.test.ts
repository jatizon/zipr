import { afterEach, describe, expect, test } from '@jest/globals';
import buildFastify from "@src/build.js";
import buildPrismaClient from '@lib/prisma.js';
import { invalidEmails, userExamples, validEmails } from '@src/tests/fixtures/urls.js';
import { clearTestDatabase, setupTestDb } from '@src/tests/helpers/db.js';

const validEmail = validEmails[0]!;
const invalidEmail = invalidEmails[0]!;

const connectionString = setupTestDb(import.meta.url);
const prisma = buildPrismaClient(connectionString);
const app = buildFastify(
    {prisma: prisma},
    {logger: false},
);

afterEach(async () => {
    await clearTestDatabase(prisma);
});

describe('POST /user/create', () => {
    test('returns 400 for an invalid email', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: {
                email: invalidEmail,
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
            payload: {},
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: "body must have required property 'email'" });

        expect(await prisma.user.count()).toBe(0);
    });

    test('returns 409 for already existing user email', async () => {
        const existing = userExamples[0]!;

        const first = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: existing,
        });
        expect(first.statusCode).toBe(201);

        const response = await app.inject({
            method: 'POST',
            url: '/user/create',
            payload: {
                email: existing.email,
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
            },
        });
        expect(response.statusCode).toBe(201);

        const { id } = response.json();
        expect(typeof id).toBe('number');

        const stored = await prisma.user.findUniqueOrThrow({
            where: { id },
        });
        expect(stored.email).toBe(validEmail);
    });
});
