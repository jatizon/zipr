import { describe, expect, test } from '@jest/globals';
import { buildFastifyWithMockedDependencies } from '@src/tests/mocks/fastify.js';
import { plugins } from '@src/build.js';
import { RATE_LIMIT_MAX } from '@src/config/limits.js';


const TEST_ROUTE_MAX = 1;
const TEST_ROUTE_TIME_WINDOW = '200ms';

describe('rate limiting', () => {
    test(`returns 429 on the request after the ${RATE_LIMIT_MAX}th within the window`, async () => {
        const app = buildFastifyWithMockedDependencies({}, { prisma: {}, redis: {} }, plugins);

        for (let i = 0; i < RATE_LIMIT_MAX; i++) {
            const response = await app.inject({ method: 'GET', url: '/health' });
            expect(response.statusCode).toBe(200);
        }

        const response = await app.inject({ method: 'GET', url: '/health' });
        expect(response.statusCode).toBe(429);
    });

    test('allows requests again once the time window has passed', async () => {
        const app = buildFastifyWithMockedDependencies({}, { prisma: {}, redis: {} }, plugins);
        app.register(async (instance) => {
            instance.get('/rate-limit-test', {
                config: {
                    rateLimit: {
                        max: TEST_ROUTE_MAX,
                        timeWindow: TEST_ROUTE_TIME_WINDOW,
                    },
                },
            }, () => 'ok');
        });

        const first = await app.inject({ method: 'GET', url: '/rate-limit-test' });
        expect(first.statusCode).toBe(200);

        const second = await app.inject({ method: 'GET', url: '/rate-limit-test' });
        expect(second.statusCode).toBe(429);

        await new Promise((resolve) => setTimeout(resolve, 250));

        const third = await app.inject({ method: 'GET', url: '/rate-limit-test' });
        expect(third.statusCode).toBe(200);
    });
});
