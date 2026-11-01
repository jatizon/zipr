import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MultiLevelCacheManager } from "@src/cache/manager.js";
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import { pluginsWithoutRateLimit } from "@tests/mocks/fastify.js";
import buildPrismaClient from '@src/clients/prisma.js';
import { decodeBase62 } from '@src/helpers/base62Codec.js';
import { ShorteningTypes } from '@src/interfaces.js';
import { allowedTiersForRoute } from '@src/config/authorization.js';
import { type Prisma } from '@generated/prisma/client.js';
import { collidingSlugs, emptySlug, invalidSlugs, invalidUrls, nonCollidingSlugs, userExamples, validUrls } from '@tests/fixtures/urls.js';
import {
    buildTestSchema,
    clearTestSchema,
    closeDbConnections,
    getTestSchemaNameFromFileUrl,
    testDbConnectionString,
} from '@tests/helpers/db.js';
import { generateTokenForUserId } from '@tests/helpers/auth.js';


const validUrl = validUrls[0]!;
const invalidUrl = invalidUrls[0]!;
const invalidSlug = invalidSlugs[0]!;

const schema = getTestSchemaNameFromFileUrl(import.meta.url);

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

let token: string;

beforeAll(async () => {
    const testSchema = await buildTestSchema(schema);
    prisma = buildPrismaClient({ connectionString: testDbConnectionString, schema: testSchema });
    app = buildFastify(
        { logger: false },
        { prisma: prisma, cacheManager: new MultiLevelCacheManager([]) },
        pluginsWithoutRateLimit,
    );

    token = await generateTokenForUserId(1);
});

afterAll(async () => {
    await prisma.$disconnect();
    await closeDbConnections();
});

afterEach(async () => {
    await clearTestSchema(schema);
});

describe('POST /shorten/auto', () => {
    describe('schema', () => {
        test('returns 400 when the authorization header is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/auto',
                payload: {
                    longUrl: validUrl,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when the longUrl field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/auto',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {},
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when longUrl is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/auto',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: {},
                },
            });
            expect(response.statusCode).toBe(400);
        });
    });

    test('returns 400 for an invalid URL', async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/auto',
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                longUrl: invalidUrl,
            }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });
    
    test("returns 404 for non-existent user", async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const fakeUserToken = await generateTokenForUserId(user.id + 1);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/auto',
            headers: {
                authorization: `Bearer ${fakeUserToken}`,
            },
            payload: {
                longUrl: validUrls[0]!,
            }
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'User not found' });
    });

    describe('valid URLs', () => {
        let user: Prisma.UserModel;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: userExamples[0]!,
            });
        });

        test("creates an auto shortened URL", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/auto',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrl,
                }
            });
            expect(response.statusCode).toBe(201);

            const { shortUrl } = response.json();
            expect(typeof shortUrl).toBe('string');
            expect(shortUrl).not.toHaveLength(0);

            const storedUrl = await prisma.url.findFirstOrThrow({
                where: {
                    ownerId: user.id,
                    longUrl: validUrl,
                    type: ShorteningTypes.Auto,
                },
            });
            expect(storedUrl.longUrl).toBe(validUrl);
            expect(storedUrl.shortUrl).toBe(shortUrl);
            expect(storedUrl.type).toBe(ShorteningTypes.Auto);
            expect(decodeBase62(shortUrl)).toBe(storedUrl.id);
        });
    });

});

describe('POST /shorten/custom', () => {
    const slug = nonCollidingSlugs[0]!;

    describe('schema', () => {
        test('returns 400 when the authorization header is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrl,
                    shortUrl: slug,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when the longUrl field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    shortUrl: slug,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when longUrl is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: {},
                    shortUrl: slug,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when the shortUrl field is missing', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrl,
                },
            });
            expect(response.statusCode).toBe(400);
        });

        test('returns 400 when shortUrl is not a string', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrl,
                    shortUrl: {},
                },
            });
            expect(response.statusCode).toBe(400);
        });
    });

    test('returns 400 for an invalid URL', async () => {
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                longUrl: invalidUrl,
                shortUrl: slug,
            }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });

    test('returns 400 for an invalid slug', async () => {
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
        });
        const token = await generateTokenForUserId(user.id);
        // Another URL is stored, so "nothing stored" means this request wrote nothing.
        await prisma.url.create({
            data: { ownerId: user.id, longUrl: validUrl, shortUrl: slug, type: ShorteningTypes.Custom },
        });

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                longUrl: validUrl,
                shortUrl: invalidSlug,
            }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid slug' });
        expect(await prisma.url.count()).toBe(1);
    });

    // The empty slug equals the first segment of the root route, so it would answer 409
    // if the collision check ran before the slug syntax check.
    test('returns 400, not 409, for an empty slug', async () => {
        const user = await prisma.user.create({
            data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                longUrl: validUrl,
                shortUrl: emptySlug,
            }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid slug' });
    });

    test('returns 403 for a free-tier user', async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const token = await generateTokenForUserId(user.id);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: {
                authorization: `Bearer ${token}`,
            },
            payload: {
                longUrl: validUrl,
                shortUrl: slug,
            }
        });
        expect(response.statusCode).toBe(403);
    });

    test("returns 404 for non-existent user", async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });
        const fakeUserToken = await generateTokenForUserId(user.id + 1);

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            headers: {
                authorization: `Bearer ${fakeUserToken}`,
            },
            payload: {
                longUrl: validUrls[0]!,
                shortUrl: slug,
            }
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'User not found' });
    });

    describe('when valid URLs', () => {
        let user: Prisma.UserModel;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
            });
        });

        test("successfully creates a custom shortened URL", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrl,
                    shortUrl: slug,
                }
            });
            expect(response.statusCode).toBe(201);
            expect(response.json()).toMatchObject({ shortUrl: slug });

            const stored = await prisma.url.findFirstOrThrow({
                where: {
                    ownerId: user.id,
                    longUrl: validUrl,
                },
            });
            expect(stored.longUrl).toBe(validUrl);
            expect(stored.shortUrl).toBe(slug);
            expect(stored.type).toBe(ShorteningTypes.Custom);
        });
    });

    describe('when slug already taken', () => {
        let owner: Prisma.UserModel;
        let other: Prisma.UserModel;

        beforeEach(async () => {
            owner = await prisma.user.create({ data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! } });
            other = await prisma.user.create({ data: { ...userExamples[1]!, tier: allowedTiersForRoute.shortenCustom[0]! } });

            const first = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrls[0]!,
                    shortUrl: slug,
                }
            });
            expect(first.statusCode).toBe(201);
        });

        test("returns 409 when the same user tries to reuse it", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrls[1]!,
                    shortUrl: slug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });

        test("returns 409 when another user tries to reuse it", async () => {
            const otherToken = await generateTokenForUserId(other.id);

            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${otherToken}`,
                },
                payload: {
                    longUrl: validUrls[1]!,
                    shortUrl: slug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });
    });

    describe('when the slug shadows a route', () => {
        let user: Prisma.UserModel;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: { ...userExamples[0]!, tier: allowedTiersForRoute.shortenCustom[0]! },
            });
        });

        test("returns 409 for a reserved slug", async () => {
            const collidingSlug = collidingSlugs[0]!;

            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                headers: {
                    authorization: `Bearer ${token}`,
                },
                payload: {
                    longUrl: validUrls[0]!,
                    shortUrl: collidingSlug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });
    });
});
