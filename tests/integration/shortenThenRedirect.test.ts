import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import { InMemoryCacheService } from "@src/cache/memory.js";
import { MultiLevelCacheManager } from "@src/cache/manager.js";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@tests/mocks/fastify.js";
import buildPrismaClient from '@src/clients/prisma.js';
import { encodeBase62 } from '@src/helpers/base62Codec.js';
import { allowedTiersForRoute } from '@src/config/authorization.js';
import { maxLengthSlug, userExamples, validUrls } from '@tests/fixtures/urls.js';
import { generateTokenForUserId } from '@tests/helpers/auth.js';
import {
    buildTestSchema,
    clearTestSchema,
    closeDbConnections,
    getTestSchemaNameFromFileUrl,
    testDbConnectionString,
} from '@tests/helpers/db.js';


// Creation and redirect are tested apart elsewhere, with rows inserted straight through
// Prisma. Here the only way in is the API, and the cache is a real level, so what one
// route writes is exactly what the other reads.
const validUrl = validUrls[0]!;

const schema = getTestSchemaNameFromFileUrl(import.meta.url);

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;
const cache = new InMemoryCacheService();

beforeAll(async () => {
    const testSchema = await buildTestSchema(schema);
    prisma = buildPrismaClient({ connectionString: testDbConnectionString, schema: testSchema });
    app = buildFastify(
        { logger: false },
        { prisma: prisma, cacheManager: new MultiLevelCacheManager([cache]) },
        pluginsWithoutRateLimit,
    );
});

afterAll(async () => {
    await prisma.$disconnect();
    await closeDbConnections();
});

// Ids restart from 1 in every test, so a cached user from the previous test would be
// served for the next test's different user with the same id.
afterEach(async () => {
    cache.cacheHashmap.clear();
    await clearTestSchema(schema);
});

// The repositories fill the cache without awaiting it, so let that work finish first.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('POST /shorten/auto then GET /a/:shortUrl', () => {
    const createAutoUrl = async () => {
        const user = await prisma.user.create({ data: userExamples[0]! });
        const token = await generateTokenForUserId(user.id);

        const created = await app.inject({
            method: 'POST',
            url: '/shorten/auto',
            headers: { authorization: `Bearer ${token}` },
            payload: { longUrl: validUrl },
        });
        expect(created.statusCode).toBe(201);

        return created.json().shortUrl as string;
    };

    test('the created short URL redirects', async () => {
        const shortUrl = await createAutoUrl();

        const redirected = await app.inject({ method: 'GET', url: `/a/${shortUrl}` });

        expect(redirected.statusCode).toBe(301);
        expect(redirected.headers.location).toBe(validUrl);
    });

    // The row is gone before the first redirect, so only the entry creation wrote can answer.
    test('the redirect finds the cache entry the creation wrote', async () => {
        const shortUrl = await createAutoUrl();
        await flushPromises();
        await prisma.url.deleteMany();

        const redirected = await app.inject({ method: 'GET', url: `/a/${shortUrl}` });

        expect(redirected.statusCode).toBe(301);
        expect(redirected.headers.location).toBe(validUrl);
    });
});

describe('POST /shorten/custom then GET /:shortUrl', () => {
    const createCustomUrl = async () => {
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
        });
        const token = await generateTokenForUserId(user.id);

        const created = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: { authorization: `Bearer ${token}` },
            payload: { longUrl: validUrl, shortUrl: maxLengthSlug },
        });
        expect(created.statusCode).toBe(201);
    };

    // The longest slug creation accepts is also the longest the redirect accepts.
    test('the created slug redirects', async () => {
        await createCustomUrl();

        const redirected = await app.inject({ method: 'GET', url: `/${maxLengthSlug}` });

        expect(redirected.statusCode).toBe(301);
        expect(redirected.headers.location).toBe(validUrl);
    });

    test('the redirect finds the cache entry the creation wrote', async () => {
        await createCustomUrl();
        await flushPromises();
        await prisma.url.deleteMany();

        const redirected = await app.inject({ method: 'GET', url: `/${maxLengthSlug}` });

        expect(redirected.statusCode).toBe(301);
        expect(redirected.headers.location).toBe(validUrl);
    });

    // Creation caches the row under its id too, so the cached path must not leak it either.
    test('the custom URL is not resolved through its id, cached or not', async () => {
        await createCustomUrl();
        await flushPromises();
        const { id } = await prisma.url.findFirstOrThrow();

        const redirected = await app.inject({ method: 'GET', url: `/a/${encodeBase62(id)}` });

        expect(redirected.statusCode).toBe(404);
    });
});
