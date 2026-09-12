import { describe, expect, test } from '@jest/globals';
import { isEmailValid } from '@src/helpers/user.js';
import { invalidEmails, validEmails } from '@src/tests/fixtures/urls.js';


describe('isEmailValid', () => {
    test.each(validEmails)('accepts: %j', (validEmail) => {
        expect(isEmailValid(validEmail)).toBe(true);
    });

    test.each(invalidEmails)('rejects: %j', (invalidEmail) => {
        expect(isEmailValid(invalidEmail)).toBe(false);
    });
});
