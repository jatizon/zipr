import { beforeAll, describe, expect, test } from '@jest/globals';
import { buildFastifyWithMockedDependencies } from '@tests/mocks/fastify.js';
import { plugins } from '@src/build.js';
import { customSlugCollidesWithRoute, isSlugValid } from '@src/helpers/url.js';
import { collidingSlugs } from '@tests/fixtures/urls.js';
import { nonCollidingSlugs } from '@tests/fixtures/urls.js';
import { validSlugs, invalidSlugs, unroutableSlugs } from '@tests/fixtures/urls.js';


const fastify = buildFastifyWithMockedDependencies({}, { prisma: {}, cacheManager: {} }, plugins);

beforeAll(async () => {
    await fastify.ready();
});

describe('customSlugCollidesWithRoute', () => {
    test.each(collidingSlugs)('returns true for a slug that collides: %j', (collidingSlug) => {
        const collides = customSlugCollidesWithRoute(collidingSlug, fastify);

        expect(collides).toBe(true);
    });

    test.each(nonCollidingSlugs)('returns false for a slug that does not collide: %j', (nonCollidingSlug) => {
        const collides = customSlugCollidesWithRoute(nonCollidingSlug, fastify);

        expect(collides).toBe(false);
    });
});

describe('isSlugValid', () => {
    test.each(validSlugs)('accepts %j', (validSlug) => {
        expect(isSlugValid(validSlug)).toBe(true);
    });

    test.each([...invalidSlugs, ...unroutableSlugs])('rejects %j', (invalidSlug) => {
        expect(isSlugValid(invalidSlug)).toBe(false);
    });
});
