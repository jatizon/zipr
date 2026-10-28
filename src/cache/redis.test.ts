import { describe, expect, jest, test } from '@jest/globals';
import { type Redis } from 'ioredis';
import {
    RedisService,
    buildRedisConnectionString,
} from '@src/cache/redis.js';


describe('buildRedisConnectionString', () => {
    test('puts password, host and port in a redis:// URL', () => {
        const connectionString = buildRedisConnectionString({
            redisPassword: 'secret',
            redisHost: 'cache-host',
            redisPort: 6380,
        });

        expect(connectionString).toBe('redis://:secret@cache-host:6380');
    });
});

// Only get/set exist on the fake: that is all RedisService is allowed to touch.
const buildFakeRedis = () => {
    const get = jest.fn<(key: string) => Promise<string | null>>();
    const set = jest.fn<(key: string, value: string) => Promise<unknown>>();

    return { get, set, redis: { get, set } as unknown as Redis };
};

describe('RedisService', () => {
    describe('get', () => {
        test('returns the stored string on a hit', async () => {
            const { get, redis } = buildFakeRedis();
            get.mockResolvedValue('value');

            const result = await new RedisService(redis).get('key');

            expect(result).toBe('value');
            expect(get).toHaveBeenCalledWith('key');
        });

        test('returns null on a miss', async () => {
            const { get, redis } = buildFakeRedis();
            // Another key is populated, so null means "looked up this key and found nothing".
            get.mockImplementation(async (key) => (key === 'other-key' ? 'value' : null));

            const result = await new RedisService(redis).get('key');

            expect(result).toBeNull();
        });

        test('returns null instead of throwing when Redis rejects', async () => {
            const { get, redis } = buildFakeRedis();
            get.mockRejectedValue(new Error('connection refused'));

            await expect(new RedisService(redis).get('key')).resolves.toBeNull();
        });
    });

    describe('set', () => {
        test('writes the value under the key', async () => {
            const { set, redis } = buildFakeRedis();
            set.mockResolvedValue('OK');

            await new RedisService(redis).set(['key'], 'value');

            expect(set).toHaveBeenCalledWith('key', 'value');
        });

        test('writes the value under every key given', async () => {
            const { set, redis } = buildFakeRedis();
            set.mockResolvedValue('OK');

            await new RedisService(redis).set(['key', 'other-key'], 'value');

            expect(set).toHaveBeenCalledWith('key', 'value');
            expect(set).toHaveBeenCalledWith('other-key', 'value');
        });

        test('resolves instead of throwing when Redis rejects', async () => {
            const { set, redis } = buildFakeRedis();
            set.mockRejectedValue(new Error('connection refused'));

            await expect(new RedisService(redis).set(['key'], 'value')).resolves.toBeUndefined();
        });
    });
});
