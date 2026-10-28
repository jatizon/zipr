import { describe, expect, jest, test } from '@jest/globals';
import { type PrismaClient } from '@generated/prisma/client.js';
import { InMemoryCacheService } from '@src/cache/memory.js';
import { MultiLevelCacheManager } from '@src/cache/manager.js';
import { loadUserWithPasswordHashByEmail, loadUserByEmail, loadUserById, saveUser } from '@src/repositories/user.js';
import { userExamples } from '@tests/fixtures/urls.js';


const dbUser = { id: 1, ...userExamples[0]! };
const otherDbUser = { id: 2, ...userExamples[1]! };

const domainOf = ({ id, email, role, tier }: typeof dbUser) => ({ id, email, role, tier });

const buildPrisma = (overrides: { findUnique?: jest.Mock, create?: jest.Mock } = {}) => {
    const findUnique = overrides.findUnique ?? jest.fn(async () => null);
    const create = overrides.create ?? jest.fn(async () => null);

    return { findUnique, create, prisma: { user: { findUnique, create } } as unknown as PrismaClient };
};

const buildCache = () => {
    const level = new InMemoryCacheService();

    return { level, cacheManager: new MultiLevelCacheManager([level]) };
};

// The repositories fill the cache without awaiting it, so let that work finish first.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('loadUserById', () => {
    test('returns the domain user from cache without touching the DB on a hit', async () => {
        const { level, cacheManager } = buildCache();
        await level.set(['user:id:1'], JSON.stringify(domainOf(dbUser)));
        const { prisma, findUnique } = buildPrisma();

        const user = await loadUserById(dbUser.id, { prisma, cacheManager });

        expect(user).toEqual(domainOf(dbUser));
        expect(findUnique).not.toHaveBeenCalled();
    });

    test('falls back to the DB and caches the domain user, without the password hash, on a miss', async () => {
        const { level, cacheManager } = buildCache();
        const { prisma } = buildPrisma({ findUnique: jest.fn(async () => dbUser) });

        const user = await loadUserById(dbUser.id, { prisma, cacheManager });
        await flushPromises();

        expect(user).toEqual(domainOf(dbUser));
        expect(JSON.parse(level.get('user:id:1')!)).toEqual(domainOf(dbUser));
    });

    test('falls back to the DB when the cached value does not match the schema', async () => {
        const { level, cacheManager } = buildCache();
        // A cached value carrying passwordHash is exactly what the domain schema must reject.
        await level.set(['user:id:1'], JSON.stringify(dbUser));
        const { prisma, findUnique } = buildPrisma({ findUnique: jest.fn(async () => dbUser) });

        const user = await loadUserById(dbUser.id, { prisma, cacheManager });

        expect(user).toEqual(domainOf(dbUser));
        expect(findUnique).toHaveBeenCalledTimes(1);
    });

    test('returns null when the userId does not exist', async () => {
        // Another user is cached, so null means "looked up this id and found nothing".
        const { level, cacheManager } = buildCache();
        await level.set(['user:id:2'], JSON.stringify(domainOf(otherDbUser)));
        const { prisma } = buildPrisma();

        const user = await loadUserById(dbUser.id, { prisma, cacheManager });

        expect(user).toBeNull();
    });
});

describe('loadUserByEmail', () => {
    test('returns the domain user from cache without touching the DB on a hit', async () => {
        const { level, cacheManager } = buildCache();
        await level.set([`user:email:${dbUser.email}`], JSON.stringify(domainOf(dbUser)));
        const { prisma, findUnique } = buildPrisma();

        const user = await loadUserByEmail(dbUser.email, { prisma, cacheManager });

        expect(user).toEqual(domainOf(dbUser));
        expect(findUnique).not.toHaveBeenCalled();
    });

    test('falls back to the DB and caches the domain user, without the password hash, on a miss', async () => {
        const { level, cacheManager } = buildCache();
        const { prisma } = buildPrisma({ findUnique: jest.fn(async () => dbUser) });

        const user = await loadUserByEmail(dbUser.email, { prisma, cacheManager });
        await flushPromises();

        expect(user).toEqual(domainOf(dbUser));
        expect(JSON.parse(level.get(`user:email:${dbUser.email}`)!)).toEqual(domainOf(dbUser));
    });

    test('returns null when the email does not exist', async () => {
        const { level, cacheManager } = buildCache();
        await level.set([`user:email:${otherDbUser.email}`], JSON.stringify(domainOf(otherDbUser)));
        const { prisma } = buildPrisma();

        const user = await loadUserByEmail(dbUser.email, { prisma, cacheManager });

        expect(user).toBeNull();
    });
});

describe('saveUser', () => {
    const { id, ...data } = dbUser;

    test('creates the row and returns the domain user', async () => {
        const { prisma, create } = buildPrisma({ create: jest.fn(async () => dbUser) });

        const saved = await saveUser(data, { prisma, cacheManager: new MultiLevelCacheManager([]) });

        expect(create).toHaveBeenCalledWith({ data });
        expect(saved).toEqual(domainOf(dbUser));
    });

    test('writes the domain user, without the password hash, under its id and email keys', async () => {
        const { level, cacheManager } = buildCache();
        const { prisma } = buildPrisma({ create: jest.fn(async () => dbUser) });

        await saveUser(data, { prisma, cacheManager });
        await flushPromises();

        expect(JSON.parse(level.get('user:id:1')!)).toEqual(domainOf(dbUser));
        expect(JSON.parse(level.get(`user:email:${dbUser.email}`)!)).toEqual(domainOf(dbUser));
    });
});

describe('loadUserWithPasswordHashByEmail', () => {
    test('returns the database row, password hash included', async () => {
        const { prisma } = buildPrisma({ findUnique: jest.fn(async () => dbUser) });

        const user = await loadUserWithPasswordHashByEmail(dbUser.email, { prisma });

        expect(user).toEqual(dbUser);
    });

    test('returns null when the email does not exist', async () => {
        const { prisma } = buildPrisma();

        const user = await loadUserWithPasswordHashByEmail(dbUser.email, { prisma });

        expect(user).toBeNull();
    });
});
