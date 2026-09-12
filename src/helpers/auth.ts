import * as jose from 'jose';
import bcrypt from "bcrypt";
import { getEnvOrThrow } from '@src/config/env.js';
import { BCRYPT_SALT_ROUNDS } from '@src/config/auth.js';


const JWT_ENCODE_ALGORITHM = 'HS256';
const JWT_SECRET = getEnvOrThrow("JWT_SECRET");
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export const getValidatedPayload = async (token: string) => {
    try {
        const { payload } = await jose.jwtVerify(token, encodedSecret);
        return payload;
    }
    catch (err) {
        if (err instanceof jose.errors.JOSEError) {
            return null;
        }
        throw err;
    }
};

export const createJwtToken = async (payload: jose.JWTPayload, expiresIn?: string) => {
    const token = new jose.SignJWT(payload)
        .setProtectedHeader({ alg: JWT_ENCODE_ALGORITHM })
        .setIssuedAt();

    if (expiresIn !== undefined)
        token.setExpirationTime(expiresIn);

    return token.sign(encodedSecret);
};

export const hashPassword = (passwordPlainText: string) => {
    return bcrypt.hash(passwordPlainText, BCRYPT_SALT_ROUNDS);
};

export const verifyPasswordHash = (passwordPlainText: string, passwordHash: string) => {
    return bcrypt.compare(passwordPlainText, passwordHash);
};
