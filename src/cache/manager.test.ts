import { describe, expect, jest, test } from '@jest/globals';
import { MultiLevelCacheManager } from '@src/cache/manager.js';


// A level backed by a Map; set records its calls so tests can tell who got written.
const buildLevel = (initial: Record<string, string> = {}) => {
    const store = new Map(Object.entries(initial));

    const get = jest.fn(async (key: string) => store.get(key) ?? null);
    const set = jest.fn(async (keys: string[], value: string) => {
        for (const key of keys)
            store.set(key, value);
    });

    return { store, get, set };
};

// get() fills the upper levels without awaiting it, so let that work finish first.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('MultiLevelCacheManager', () => {
    describe('get', () => {
        test('returns a first-level hit without writing to any level', async () => {
            const first = buildLevel({ key: 'value' });
            const second = buildLevel();

            const result = await new MultiLevelCacheManager([first, second]).get('key');
            await flushPromises();

            expect(result).toBe('value');
            expect(first.set).not.toHaveBeenCalled();
            expect(second.set).not.toHaveBeenCalled();
        });

        test('fills the levels above a deeper hit exactly once and leaves the hit level alone', async () => {
            const first = buildLevel();
            const second = buildLevel({ key: 'value' });

            const result = await new MultiLevelCacheManager([first, second]).get('key');
            await flushPromises();

            expect(result).toBe('value');
            expect(first.store.get('key')).toBe('value');
            expect(first.set).toHaveBeenCalledTimes(1);
            expect(second.set).not.toHaveBeenCalled();
        });

        test('prefers the first level when two levels hold different values', async () => {
            const first = buildLevel({ key: 'fresh' });
            const second = buildLevel({ key: 'stale' });

            const result = await new MultiLevelCacheManager([first, second]).get('key');

            expect(result).toBe('fresh');
        });

        test('returns null and writes nothing on a miss in every level', async () => {
            // Another key is cached, so null means "looked up this key and found nothing".
            const first = buildLevel({ 'other-key': 'value' });
            const second = buildLevel();

            const result = await new MultiLevelCacheManager([first, second]).get('key');
            await flushPromises();

            expect(result).toBeNull();
            expect(first.set).not.toHaveBeenCalled();
            expect(second.set).not.toHaveBeenCalled();
        });
    });

    describe('set', () => {
        test('writes every key to every level', async () => {
            const first = buildLevel();
            const second = buildLevel();

            await new MultiLevelCacheManager([first, second]).set(['key', 'other-key'], 'value');

            for (const level of [first, second]) {
                expect(level.store.get('key')).toBe('value');
                expect(level.store.get('other-key')).toBe('value');
            }
        });

        test('resolves instead of throwing when a level fails', async () => {
            const failing = buildLevel();
            failing.set.mockRejectedValue(new Error('connection refused'));

            await expect(
                new MultiLevelCacheManager([failing, buildLevel()]).set(['key'], 'value'),
            ).resolves.toBeUndefined();
        });
    });
});
