import { Redis } from "ioredis";


export const buildRedisClient = (connectionString: string) => {
    return new Redis(connectionString);
};
