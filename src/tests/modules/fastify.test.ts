import { describe, expect, test } from '@jest/globals';
import { buildFastifyWithMockedDependencies } from '@src/tests/mocks/fastify.js';
import { urlWithReservedCharacters } from '@src/tests/fixtures/urls.js';
import { encodeBase62 } from '@src/helpers/base62Codec.js';


const shortUrl = encodeBase62(1);

const app = buildFastifyWithMockedDependencies({
    prisma: {
        url: {
            findUnique: async () => ({ longUrl: urlWithReservedCharacters }),
        },
    },
});

describe('reply.redirect', () => {
    test('leaves reserved characters in the Location header untouched', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/a/${shortUrl}`,
        });

        expect(response.statusCode).toBe(301);
        expect(response.headers.location).toBe(urlWithReservedCharacters);
    });
});
