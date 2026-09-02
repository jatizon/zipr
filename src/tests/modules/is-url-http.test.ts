import { describe, expect, test } from '@jest/globals';
import isUrlHttp from 'is-url-http';
import { validUrls, invalidUrls } from '@src/tests/fixtures/urls.js';


describe('is-url-http', () => {
    test.each(validUrls)('accepts: %j', (validUrl) => {
        expect(isUrlHttp(validUrl)).toBe(true);
    });

    test.each(invalidUrls)('rejects: %j', (invalidUrl) => {
        expect(isUrlHttp(invalidUrl)).toBe(false);
    });
});
