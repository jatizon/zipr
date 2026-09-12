import { describe, expect, test } from '@jest/globals';
import { type PrismaClient } from '@generated/prisma/client.js';
import resolveUser from '@src/helpers/resolveUser.js';
import { userExamples } from '@src/tests/fixtures/urls.js';


describe('resolveUser', () => {
    test('returns null when the userId does not exist', async () => {
        const prisma = {
            user: {
                findUnique: async () => null,
            },
        } as unknown as PrismaClient;

        const user = await resolveUser(999, prisma);

        expect(user).toBeNull();
    });

    test('returns the domain user for an existing userId', async () => {
        const dbUser = { id: 1, ...userExamples[0]! };
        const prisma = {
            user: {
                findUnique: async () => dbUser,
            },
        } as unknown as PrismaClient;

        const user = await resolveUser(1, prisma);

        expect(user).toEqual({
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            tier: dbUser.tier,
        });
    });
});
