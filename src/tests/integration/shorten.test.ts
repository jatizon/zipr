import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from '@jest/globals';
import buildFastify, { type TypeBoxFastifyInstance } from "@src/build.js";
import buildPrismaClient from '@lib/prisma.js';
import { validUrls, userExamples, invalidUrls } from '@src/tests/fixtures/urls.js';
import { collidingSlugs, nonCollidingSlugs } from '@src/tests/fixtures/urls.js';
import { decodeBase62 } from '@src/helpers/base62Codec.js';
import { ShorteningTypes } from '@src/interfaces.js';
import { type User } from '@generated/prisma/client.js';
import { clearTestSchema, buildTestSchema } from '@src/tests/helpers/db.js';
import { testDbConnectionString } from '@src/tests/helpers/db.js';
import { closeDbConnections } from '@src/tests/helpers/db.js';


const validUrl = validUrls[0]!;
const invalidUrl = invalidUrls[0]!;

let prisma: ReturnType<typeof buildPrismaClient>;
let app: TypeBoxFastifyInstance;

beforeAll(async () => {
    const testSchema = await buildTestSchema(import.meta.url);
    prisma = buildPrismaClient(testDbConnectionString, testSchema);
    app = buildFastify(
        {prisma: prisma},
        {logger: false}
    );
});

afterAll(async () => {
    await prisma.$disconnect();
    await closeDbConnections();
});

afterEach(async () => {
    await clearTestSchema(import.meta.url);
});

describe('POST /shorten/auto', () => {
    test('returns 400 for an invalid URL', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/shorten/auto',
            payload: {
                ownerId: 1,
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

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/auto',
            payload: {
                longUrl: validUrls[0]!,
                ownerId: user.id + 1,
            }
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'User not found' });
    });

    describe('valid URLs', () => {
        let user: User;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: userExamples[0]!,
            });
        });

        test("creates an auto shortened URL", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/auto',
                payload: {
                    longUrl: validUrl,
                    ownerId: user.id,
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
                    shorteningType: ShorteningTypes.Auto,
                },
            });
            expect(storedUrl.longUrl).toBe(validUrl);
            expect(storedUrl.shortUrl).toBe(shortUrl);
            expect(storedUrl.shorteningType).toBe(ShorteningTypes.Auto);
            expect(decodeBase62(shortUrl)).toBe(storedUrl.id);
        });
    });

});

describe('POST /shorten/custom', () => {
    const slug = nonCollidingSlugs[0]!;

    test('returns 400 for an invalid URL', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            payload: {
                ownerId: 1,
                longUrl: invalidUrl,
                shortUrl: slug,
            }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ message: 'Invalid Url' });
    });

    test("returns 404 for non-existent user", async () => {
        const user = await prisma.user.create({
            data: userExamples[0]!,
        });

        const response = await app.inject({
            method: 'POST',
            url: '/shorten/custom',
            payload: {
                longUrl: validUrls[0]!,
                ownerId: user.id + 1,
                shortUrl: slug,
            }
        });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({ message: 'User not found' });
    });

    describe('when valid URLs', () => {
        let user: User;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: userExamples[0]!,
            });
        });

        test("successfully creates a custom shortened URL", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrl,
                    ownerId: user.id,
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
            expect(stored.shorteningType).toBe(ShorteningTypes.Custom);
        });
    });

    describe('when slug already taken', () => {
        let owner: User;
        let other: User;

        beforeEach(async () => {
            owner = await prisma.user.create({ data: userExamples[0]! });
            other = await prisma.user.create({ data: userExamples[1]! });

            const first = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrls[0]!,
                    ownerId: owner.id,
                    shortUrl: slug,
                }
            });
            expect(first.statusCode).toBe(201);
        });

        test("returns 409 when the same user tries to reuse it", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrls[1]!,
                    ownerId: owner.id,
                    shortUrl: slug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });

        test("returns 409 when another user tries to reuse it", async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrls[1]!,
                    ownerId: other.id,
                    shortUrl: slug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });
    });

    describe('when the slug shadows a route', () => {
        let user: User;

        beforeEach(async () => {
            user = await prisma.user.create({
                data: userExamples[0]!,
            });
        });

        test("returns 409 for a reserved slug", async () => {
            const collidingSlug = collidingSlugs[0]!;

            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrls[0]!,
                    ownerId: user.id,
                    shortUrl: collidingSlug,
                }
            });
            expect(response.statusCode).toBe(409);
            expect(response.json()).toMatchObject({ message: 'Slug already taken' });
        });

        test("still accepts a slug that shadows nothing", async () => {
            const nonCollidingSlug = nonCollidingSlugs[1]!;

            const response = await app.inject({
                method: 'POST',
                url: '/shorten/custom',
                payload: {
                    longUrl: validUrls[0]!,
                    ownerId: user.id,
                    shortUrl: nonCollidingSlug,
                }
            });
            expect(response.statusCode).toBe(201);
            expect(response.json()).toMatchObject({ shortUrl: nonCollidingSlug });
        });
    });
});
