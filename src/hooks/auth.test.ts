import { describe, expect, jest, test } from '@jest/globals';
import { type FastifyReply } from 'fastify';
import authHook, { type AuthRequest } from '@src/hooks/auth.js';
import { createJwtToken } from '@src/helpers/auth.js';


const buildReply = () => {
    const reply = {
        badRequest: jest.fn(() => reply),
        unauthorized: jest.fn(() => reply),
    };
    return reply as unknown as FastifyReply;
};

const buildRequest = (authorization?: string) => ({
    headers: { authorization },
}) as AuthRequest;

const invalidAuthorizationHeaders = [
    {
        description: 'scheme is not Bearer',
        authorization: 'Basic abc123',
        expectedMessage: 'Invalid authorization scheme',
    },
    {
        description: 'token is missing after "Bearer "',
        authorization: 'Bearer',
        expectedMessage: 'Missing authorization token',
    },
];

const invalidSubs = [
    { description: 'sub is not numeric', sub: 'abc' },
    { description: 'sub is not an integer', sub: '1.5' },
    { description: 'sub is zero', sub: '0' },
    { description: 'sub is negative', sub: '-5' },
];

describe('authHook', () => {
    test.each(invalidAuthorizationHeaders)('returns 400 when $description', async ({ authorization, expectedMessage }) => {
        const request = buildRequest(authorization);
        const reply = buildReply();

        await authHook(request, reply);

        expect(reply.badRequest).toHaveBeenCalledWith(expectedMessage);
    });

    test('returns 401 for an invalid/expired token', async () => {
        const request = buildRequest('Bearer not-a-valid-jwt');
        const reply = buildReply();

        await authHook(request, reply);

        expect(reply.unauthorized).toHaveBeenCalledWith('Invalid token');
    });

    test('returns 401 when the payload has no sub claim', async () => {
        const token = await createJwtToken({}, '2h');
        const request = buildRequest(`Bearer ${token}`);
        const reply = buildReply();

        await authHook(request, reply);

        expect(reply.unauthorized).toHaveBeenCalledWith('Invalid token');
    });

    test.each(invalidSubs)('returns 401 when $description', async ({ sub }) => {
        const token = await createJwtToken({ sub }, '2h');
        const request = buildRequest(`Bearer ${token}`);
        const reply = buildReply();

        await authHook(request, reply);

        expect(reply.unauthorized).toHaveBeenCalledWith('Invalid token');
    });

    test('sets request.userId for a valid token', async () => {
        const token = await createJwtToken({ sub: '42' }, '2h');
        const request = buildRequest(`Bearer ${token}`);
        const reply = buildReply();

        await authHook(request, reply);

        expect(request.userId).toBe(42);
        expect(reply.badRequest).not.toHaveBeenCalled();
        expect(reply.unauthorized).not.toHaveBeenCalled();
    });
});
