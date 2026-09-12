import { beforeAll, describe, expect, test } from '@jest/globals';
import * as jose from 'jose';
import { createJwtToken, getValidatedPayload, hashPassword, verifyPasswordHash } from '@src/helpers/auth.js';
import { invalidTokens, payloadExample } from '@src/tests/fixtures/auth.js';


const HOURS = 60 * 60;

let validToken: string;

beforeAll(async () => {
    validToken = await createJwtToken(payloadExample, '2h');
});

describe('getValidatedPayload', () => {
    test.each(invalidTokens)('returns null for $description', async ({ build }) => {
        const invalidToken = await build();
        expect(await getValidatedPayload(invalidToken)).toBeNull();
    });

    test('returns the expected payload for a valid token', async () => {
        expect(await getValidatedPayload(validToken)).toMatchObject(payloadExample);
    });
});

describe('createJwtToken', () => {
    test('creates a valid token', async () => {
        const { iat, exp } = jose.decodeJwt(validToken);

        expect(exp! - iat!).toBe(2 * HOURS);
    });
});

describe('hashPassword', () => {
    test('returns a hash different from the plain-text password', async () => {
        const hash = await hashPassword('correct-horse-battery-staple');

        expect(hash).not.toBe('correct-horse-battery-staple');
    });

    test('returns a different hash each time, even for the same password', async () => {
        const [first, second] = await Promise.all([
            hashPassword('correct-horse-battery-staple'),
            hashPassword('correct-horse-battery-staple'),
        ]);

        expect(first).not.toBe(second);
    });
});

describe('verifyPasswordHash', () => {
    test('returns true for the correct password', async () => {
        const hash = await hashPassword('correct-horse-battery-staple');

        expect(await verifyPasswordHash('correct-horse-battery-staple', hash)).toBe(true);
    });

    test('returns false for an incorrect password', async () => {
        const hash = await hashPassword('correct-horse-battery-staple');

        expect(await verifyPasswordHash('wrong-password', hash)).toBe(false);
    });
});
