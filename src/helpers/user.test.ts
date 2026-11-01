import { describe, expect, test } from '@jest/globals';
import { isEmailValid, normalizeEmail } from '@src/helpers/user.js';
import { emailNormalizationCases, invalidEmails, validEmails } from '@tests/fixtures/urls.js';


describe('isEmailValid', () => {
    test.each(validEmails)('accepts: %j', (validEmail) => {
        expect(isEmailValid(validEmail)).toBe(true);
    });

    test.each(invalidEmails)('rejects: %j', (invalidEmail) => {
        expect(isEmailValid(invalidEmail)).toBe(false);
    });
});

describe('normalizeEmail', () => {
    test.each(emailNormalizationCases)('$input -> $expected', ({ input, expected }) => {
        expect(normalizeEmail(input)).toBe(expected);
    });

    test.each(emailNormalizationCases)('is idempotent for $input', ({ input }) => {
        expect(normalizeEmail(normalizeEmail(input))).toBe(normalizeEmail(input));
    });
});
