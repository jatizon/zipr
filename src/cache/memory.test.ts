import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { InMemoryCacheService } from '@src/cache/memory.js';
import { CACHE_TTL_SECONDS } from '@src/config/limits.js';


describe('InMemoryCacheService', () => {
    test('get returns what set stored', async () => {
        const cache = new InMemoryCacheService();

        await cache.set(['key'], 'value');

        expect(cache.get('key')).toBe('value');
    });

    test('get returns null for a key that was never set', async () => {
        const cache = new InMemoryCacheService();
        await cache.set(['other-key'], 'value');

        expect(cache.get('key')).toBeNull();
    });

    test('set stores the value under every key given', async () => {
        const cache = new InMemoryCacheService();

        await cache.set(['key', 'other-key'], 'value');

        expect(cache.get('key')).toBe('value');
        expect(cache.get('other-key')).toBe('value');
    });

    test('set on an existing key overwrites it', async () => {
        const cache = new InMemoryCacheService();
        await cache.set(['key'], 'old');

        await cache.set(['key'], 'new');

        expect(cache.get('key')).toBe('new');
    });

    describe('expiration', () => {
        const ttlMs = CACHE_TTL_SECONDS * 1000;

        afterEach(() => {
            jest.useRealTimers();
        });

        test('get still returns the value just before the TTL', async () => {
            jest.useFakeTimers();
            const cache = new InMemoryCacheService();
            await cache.set(['key'], 'value');

            jest.advanceTimersByTime(ttlMs - 1);

            expect(cache.get('key')).toBe('value');
        });

        test('get returns null once the TTL has passed, and only for the expired key', async () => {
            jest.useFakeTimers();
            const cache = new InMemoryCacheService();
            await cache.set(['key'], 'value');
            jest.advanceTimersByTime(ttlMs / 2);
            await cache.set(['other-key'], 'other-value');

            jest.advanceTimersByTime(ttlMs / 2);

            expect(cache.get('key')).toBeNull();
            expect(cache.get('other-key')).toBe('other-value');
        });

        test('set on an existing key restarts its TTL', async () => {
            jest.useFakeTimers();
            const cache = new InMemoryCacheService();
            await cache.set(['key'], 'old');
            jest.advanceTimersByTime(ttlMs - 1);

            await cache.set(['key'], 'new');
            jest.advanceTimersByTime(ttlMs - 1);

            expect(cache.get('key')).toBe('new');
        });
    });
});
