import { createJwtToken } from '@src/helpers/auth.js';


export const payloadExample = { sub: 'user-123' };

type InvalidTokenCase = {
    description: string;
    build: () => Promise<string>;
}; 

export const invalidTokens: InvalidTokenCase[] = [
    {
        description: 'malformed token',
        build: async () => 'not-a-valid-jwt',
    },
    {
        description: 'expired token',
        build: () => createJwtToken(payloadExample, '-1h'),
    },
    {
        description: 'token with a tampered signature',
        build: async () => {
            const token = await createJwtToken(payloadExample, '2h');
            const [header, body] = token.split('.');
            return `${header}.${body}.tampered-signature`;
        },
    },
];