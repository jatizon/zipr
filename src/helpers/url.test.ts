import { beforeAll, describe, expect, test } from '@jest/globals';
import { buildFastifyWithMockedDependencies } from '@src/tests/mocks/fastify.js';
import { customSlugCollidesWithRoute, isSlugValid } from '@src/helpers/url.js';
import { collidingSlugs } from '@src/tests/fixtures/urls.js';
import { nonCollidingSlugs } from '@src/tests/fixtures/urls.js';
import { validSlugs, invalidSlugs, unroutableSlugs } from '@src/tests/fixtures/urls.js';


const fastify = buildFastifyWithMockedDependencies({ prisma: {} });

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

    test('rejects a missing slug', () => {
        expect(isSlugValid(undefined)).toBe(false);
    });
});
