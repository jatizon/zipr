import { type Redis } from "ioredis";
import { CACHE_TTL_SECONDS } from "@src/config/limits.js";


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

export class RedisService {
    redis: Redis;

    constructor(redis: Redis){
        this.redis = redis;
    }

    async get(key: string): Promise<string | null> {
        let retrieved: string | null;

        try {
            retrieved = await this.redis.get(key);
        }
        catch {
            retrieved = null;
        }

        return retrieved;
    }

    async set(keys: string[], value: string): Promise<void> {
        try {
            for (const key of keys)
                await this.redis.set(key, value, "EX", CACHE_TTL_SECONDS);
        }
        catch {
            // Do nothing
        }
    }
}