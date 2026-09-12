import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import { type Redis } from "ioredis";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@src/tests/mocks/fastify.js";
import buildPrismaClient from '@src/clients/prisma.js';
import { validUrls, userExamples, nonCollidingSlugs, base62CleanNonCollidingSlug, oversizedAutoSlug } from '@src/tests/fixtures/urls.js';
import { invalidSlugs, unroutableSlugs } from '@src/tests/fixtures/urls.js';
import { encodeBase62 } from '@src/helpers/base62Codec.js';
import { ShorteningTypes } from '@src/interfaces.js';
import { clearTestSchema, buildTestSchema } from '@src/tests/helpers/db.js';
import { testDbConnectionString } from '@src/tests/helpers/db.js';
import { closeDbConnections } from '@src/tests/helpers/db.js';
import { getTestSchemaNameFromFileUrl } from '@src/tests/helpers/db.js';


const validUrl = validUrls[0]!;
const invalidSlug = invalidSlugs[0]!;
const unroutableSlug = unroutableSlugs[0]!;

const schema = getTestSchemaNameFromFileUrl(import.meta.url);

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

beforeAll(async () => {
    const testSchema = await buildTestSchema(schema);
    prisma = buildPrismaClient({ connectionString: testDbConnectionString, schema: testSchema });
    app = buildFastify(
        { logger: false },
        { prisma: prisma, redis: {} as unknown as Redis },
        pluginsWithoutRateLimit,
    );
});

const createUser = () => prisma.user.create({
    data: userExamples[0]!,
});

const createAutoUrl = async (ownerId: number) => {
    const created = await prisma.url.create({
        data: {
            ownerId: ownerId,
            longUrl: validUrl,
            shorteningType: ShorteningTypes.Auto,
        },
    });
    return prisma.url.update({
        where: { id: created.id },
        data: { shortUrl: encodeBase62(created.id) },
    });
};

const createCustomUrl = (ownerId: number, shortUrl: string) => prisma.url.create({
    data: {
        ownerId: ownerId,
        longUrl: validUrl,
        shortUrl: shortUrl,
        shorteningType: ShorteningTypes.Custom,
    },
});

afterAll(async () => {
    await prisma.$disconnect();
    await closeDbConnections();
});

afterEach(async () => {
    await clearTestSchema(schema);
});

describe('GET /a/:shortUrl', () => {
    test('redirects to the long URL', async () => {
        const user = await createUser();
        const url = await createAutoUrl(user.id);

        const response = await app.inject({
            method: 'GET',
            url: `/a/${url.shortUrl}`,
        });
        expect(response.statusCode).toBe(301);
        expect(response.headers.location).toBe(validUrl);
    });

    test('returns 404 for a short URL that does not exist', async () => {
        const user = await createUser();
        const url = await createAutoUrl(user.id);
        const unusedSlug = encodeBase62(url.id + 1);
        expect(unusedSlug).not.toBe(url.shortUrl);

        const response = await app.inject({
            method: 'GET',
            url: `/a/${unusedSlug}`,
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'Shortened Url not found' });
    });

    test('returns 400 for an invalid slug', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/a/${invalidSlug}`,
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });

    test('404s at the router, never reaching the handler', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/a/${unroutableSlug}`,
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            message: `Route GET:/a/${unroutableSlug} not found`,
        });
    });

    test('returns 400 for a slug too large to be a valid id', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/a/${oversizedAutoSlug}`,
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });

    test('does not resolve a custom slug', async () => {
        const user = await createUser();
        const slug = base62CleanNonCollidingSlug;
        await createCustomUrl(user.id, slug);

        const response = await app.inject({
            method: 'GET',
            url: `/a/${slug}`,
        });
        expect(response.statusCode).toBe(404);
    });
});

describe('GET /:shortUrl', () => {
    test('redirects to the long URL', async () => {
        const user = await createUser();
        const slug = nonCollidingSlugs[0]!;
        await createCustomUrl(user.id, slug);

        const response = await app.inject({
            method: 'GET',
            url: `/${slug}`,
        });
        expect(response.statusCode).toBe(301);
        expect(response.headers.location).toBe(validUrl);
    });

    test('returns 404 for a slug nobody claimed', async () => {
        const user = await createUser();
        const claimedSlug = nonCollidingSlugs[0]!;
        const unclaimedSlug = nonCollidingSlugs[1]!;
        await createCustomUrl(user.id, claimedSlug);

        const response = await app.inject({
            method: 'GET',
            url: `/${unclaimedSlug}`,
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'Shortened Url not found' });
    });

    test('returns 400 for an invalid slug', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/${invalidSlug}`,
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });

    test('404s at the router, never reaching the handler', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/${unroutableSlug}`,
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
            message: `Route GET:/${unroutableSlug} not found`,
        });
    });

    test('does not resolve an Auto slug', async () => {
        const user = await createUser();
        const url = await createAutoUrl(user.id);

        const response = await app.inject({
            method: 'GET',
            url: `/${url.shortUrl}`,
        });
        expect(response.statusCode).toBe(404);
    });

    test('leaves the static routes alone', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health',
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe('healthy');
    });
});
