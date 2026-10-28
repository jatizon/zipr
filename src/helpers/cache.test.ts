import { describe, expect, test } from '@jest/globals';
import { buildCacheKey, buildCacheValue } from '@src/helpers/cache.js';


describe('buildCacheKey', () => {
    test('is the same for the same inputs', () => {
        expect(buildCacheKey('url', 'id', '1')).toBe(buildCacheKey('url', 'id', '1'));
    });

    test('differs for different values', () => {
        expect(buildCacheKey('url', 'id', '1')).not.toBe(buildCacheKey('url', 'id', '2'));
    });

    test('differs for the same value under a different identifier', () => {
        // An Auto id and a Custom slug can both be "5"; they must not share a cache entry.
        expect(buildCacheKey('url', 'id', '5')).not.toBe(buildCacheKey('url', 'shortUrl', '5'));
    });

    test('differs for the same identifier and value under a different resource', () => {
        expect(buildCacheKey('url', 'id', '1')).not.toBe(buildCacheKey('user', 'id', '1'));
    });

    // Identifier and value are concatenated, so without a separator the split point
    // is lost.
    test('keeps identifier and value apart when their concatenation matches', () => {
        expect(buildCacheKey('url', 'id', '15')).not.toBe(buildCacheKey('url', 'id1', '5'));
    });
});

describe('buildCacheValue', () => {
    test('round-trips through JSON.parse', () => {
        const value = { id: 1, nested: { name: 'zipr' } };

        const serialized = buildCacheValue(value);

        expect(JSON.parse(serialized!)).toEqual(value);
    });
});
