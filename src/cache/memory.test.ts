import { describe, expect, test } from '@jest/globals';
import { InMemoryCacheService } from '@src/cache/memory.js';


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
});
