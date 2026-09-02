import { describe, expect, test } from '@jest/globals';
import { encodeBase62, decodeBase62 } from '@src/helpers/base62Codec.js';

const TOTAL = 300_000;

const idsUpTo = (total: number): number[] => Array.from({ length: total }, (_, id) => id);

const ids = idsUpTo(TOTAL);
const slugs = ids.map(encodeBase62);

describe('round trip', () => {
    test(`decode(encode(id)) returns the original id for ${TOTAL} ids`, () => {
        expect(ids.filter((id) => decodeBase62(slugs[id]!) !== id)).toEqual([]);
    });

    test.each([2_147_483_647, Number.MAX_SAFE_INTEGER])('survives %i', (id) => {
        expect(decodeBase62(encodeBase62(id))).toBe(id);
    });
});

describe('encode produces distinct slugs', () => {
    test('no two ids share a slug', () => {
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    test('no slug is empty', () => {
        expect(slugs.filter((slug) => slug.length === 0)).toEqual([]);
    });
});

describe('slug length grows at the powers of 62', () => {
    const boundaries: [number, number, number][] = [
        [62**1 - 1, 62**1, 1],
        [62**2 - 1, 62**2, 2],
        [62**3 - 1, 62**3, 3],
    ];

    test.each(boundaries)('%i still fits in %3$i chars, %i needs one more', (last, first, length) => {
        expect(encodeBase62(last)).toHaveLength(length);
        expect(encodeBase62(first)).toHaveLength(length + 1);
    });
});

describe('alphabet order', () => {
    // Without these, swapping to "0-9 A-Z a-z" would pass every property above.
    test.each([
        [10, 'a'],
        [36, 'A'],
        [62, '10'],
    ])('encodes %i as %j', (id, expected) => {
        expect(encodeBase62(id)).toBe(expected);
    });
});
