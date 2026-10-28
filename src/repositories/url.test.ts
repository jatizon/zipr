import { describe, expect, jest, test } from '@jest/globals';
import { type PrismaClient } from '@generated/prisma/client.js';
import { InMemoryCacheService } from '@src/cache/memory.js';
import { MultiLevelCacheManager } from '@src/cache/manager.js';
import { ShorteningTypes } from '@src/interfaces.js';
import { loadUrlById, loadUrlByShortUrlAndType, saveUrl } from '@src/repositories/url.js';
import { validSlugs, validUrls } from '@tests/fixtures/urls.js';


const buildUrl = (overrides: Partial<{ id: number, shortUrl: string, type: ShorteningTypes }> = {}) => ({
    id: 1,
    ownerId: 1,
    longUrl: validUrls[0]!,
    shortUrl: validSlugs[0]!,
    type: ShorteningTypes.Custom,
    ...overrides,
});

const buildPrisma = (overrides: { findUnique?: jest.Mock, create?: jest.Mock } = {}) => {
    const findUnique = overrides.findUnique ?? jest.fn(async () => null);
    const create = overrides.create ?? jest.fn(async () => null);

    return { findUnique, create, prisma: { url: { findUnique, create } } as unknown as PrismaClient };
};

const buildCache = () => {
    const level = new InMemoryCacheService();

    return { level, cacheManager: new MultiLevelCacheManager([level]) };
};

// The repositories fill the cache without awaiting it, so let that work finish first.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('loadUrlById', () => {
    test('returns the domain URL from cache without touching the DB on a hit', async () => {
        const url = buildUrl();
        const { level, cacheManager } = buildCache();
        await level.set(['url:id:1'], JSON.stringify(url));
        const { prisma, findUnique } = buildPrisma();

        const loaded = await loadUrlById(url.id, { prisma, cacheManager });

        expect(loaded).toEqual(url);
        expect(findUnique).not.toHaveBeenCalled();
    });

    test('falls back to the DB and caches the result on a miss', async () => {
        const url = buildUrl();
        const { level, cacheManager } = buildCache();
        const { prisma } = buildPrisma({ findUnique: jest.fn(async () => url) });

        const loaded = await loadUrlById(url.id, { prisma, cacheManager });
        await flushPromises();

        expect(loaded).toEqual(url);
        expect(JSON.parse(level.get('url:id:1')!)).toEqual(url);
    });

    test('falls back to the DB when the cached value does not match the schema', async () => {
        const url = buildUrl();
        const { level, cacheManager } = buildCache();
        await level.set(['url:id:1'], JSON.stringify({ id: 'not-a-number' }));
        const { prisma, findUnique } = buildPrisma({ findUnique: jest.fn(async () => url) });

        const loaded = await loadUrlById(url.id, { prisma, cacheManager });

        expect(loaded).toEqual(url);
        expect(findUnique).toHaveBeenCalledTimes(1);
    });

    test('returns null when the DB has no matching row', async () => {
        // Another URL is cached, so null means "looked up this id and found nothing".
        const { level, cacheManager } = buildCache();
        await level.set(['url:id:2'], JSON.stringify(buildUrl({ id: 2 })));
        const { prisma } = buildPrisma();

        const loaded = await loadUrlById(1, { prisma, cacheManager });

        expect(loaded).toBeNull();
    });
});

describe('loadUrlByShortUrlAndType', () => {
    const cacheKey = (type: ShorteningTypes, shortUrl: string) => `url:shortUrl_${type}:${shortUrl}`;

    test('returns the domain URL from cache without touching the DB on a hit', async () => {
        const url = buildUrl();
        const { level, cacheManager } = buildCache();
        await level.set([cacheKey(url.type, url.shortUrl)], JSON.stringify(url));
        const { prisma, findUnique } = buildPrisma();

        const loaded = await loadUrlByShortUrlAndType(url.shortUrl, url.type, { prisma, cacheManager });

        expect(loaded).toEqual(url);
        expect(findUnique).not.toHaveBeenCalled();
    });

    test('falls back to the DB and caches the result on a miss', async () => {
        const url = buildUrl();
        const { level, cacheManager } = buildCache();
        const { prisma } = buildPrisma({ findUnique: jest.fn(async () => url) });

        const loaded = await loadUrlByShortUrlAndType(url.shortUrl, url.type, { prisma, cacheManager });
        await flushPromises();

        expect(loaded).toEqual(url);
        expect(JSON.parse(level.get(cacheKey(url.type, url.shortUrl))!)).toEqual(url);
    });

    test('returns null when the DB has no row with that slug and type', async () => {
        // Same slug is cached under another type, so the type is part of what must miss.
        const { level, cacheManager } = buildCache();
        const other = buildUrl({ type: ShorteningTypes.Auto });
        await level.set([cacheKey(other.type, other.shortUrl)], JSON.stringify(other));
        const { prisma } = buildPrisma();

        const loaded = await loadUrlByShortUrlAndType(other.shortUrl, ShorteningTypes.Custom, { prisma, cacheManager });

        expect(loaded).toBeNull();
    });
});

describe('saveUrl', () => {
    test('creates the row and returns the domain URL', async () => {
        const url = buildUrl();
        const { prisma, create } = buildPrisma({ create: jest.fn(async () => url) });
        const { id, ...data } = url;

        const saved = await saveUrl(data, { prisma, cacheManager: new MultiLevelCacheManager([]) });

        expect(create).toHaveBeenCalledWith({ data });
        expect(saved).toEqual(url);
    });

    // The keys are built inside the repository, so this is what proves save and load agree.
    test('caches the row under the keys both loaders read', async () => {
        const url = buildUrl();
        const { cacheManager } = buildCache();
        const { prisma, findUnique } = buildPrisma({ create: jest.fn(async () => url) });
        const { id, ...data } = url;

        await saveUrl(data, { prisma, cacheManager });
        await flushPromises();

        expect(await loadUrlById(url.id, { prisma, cacheManager })).toEqual(url);
        expect(await loadUrlByShortUrlAndType(url.shortUrl, url.type, { prisma, cacheManager })).toEqual(url);
        expect(findUnique).not.toHaveBeenCalled();
    });
});
