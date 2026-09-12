import { type Redis } from "ioredis";
import { type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { stringify } from "safe-stable-stringify";


type BuildRedisConnectionStringParams = {
    redisPassword: string,
    redisHost: string,
    redisPort: number,
};

export const buildRedisConnectionString = ({
    redisPassword,
    redisHost,
    redisPort,
}: BuildRedisConnectionStringParams) => {
    return `redis://:${redisPassword}@${redisHost}:${redisPort}`;
};

export const buildRedisKey = (resource: string, identifier: object) => {
    const serializedIdentifier = stringify(identifier);
    return `${resource}:${serializedIdentifier}`;
};

export const buildRedisValue = (value: object) => {
    return stringify(value);
};

const cacheGetSafe = async (key: string, redis: Redis) => {
    try {
        return await redis.get(key);
    }
    catch {
        return null;
    }
};

export const cacheSetSafe = async (key: string, value: string, redis: Redis) => {
    try {
        await redis.set(key, value);
    }
    catch {
        // Do nothing
    }
};

export const saveWithCache = async <T>(
    cacheKeys: string[], 
    value: string,
    { redis }: { redis: Redis },
    createOnDb: () => Promise<T>, 
): Promise<T> => {
    const created = await createOnDb();

    for (const cacheKey of cacheKeys) {
        await cacheSetSafe(cacheKey, value, redis);
    }   

    return created;
};

export const loadWithCache = async <T>(
    key: string,
    { redis, redisSchema }: { redis: Redis, redisSchema: TSchema },
    dbFallback: () => Promise<T | null>,
): Promise<T | null> => {
    const cached = await cacheGetSafe(key, redis);

    if (cached !== null) {
        let cachedParsed: object | null;

        try {
            cachedParsed = JSON.parse(cached);
        } catch {
            cachedParsed = null;
        }

        if (cachedParsed !== null && Value.Check(redisSchema, cachedParsed))
            return cachedParsed as T;
    }

    const fetchedFromDb = await dbFallback();
    if (fetchedFromDb !== null) {
        const fetchedString = JSON.stringify(fetchedFromDb);
        await cacheSetSafe(key, fetchedString, redis);
    }

    return fetchedFromDb;
};
