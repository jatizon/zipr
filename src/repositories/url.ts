import { type PrismaClient, type Prisma } from "@generated/prisma/client.js";
import { type Redis } from "ioredis";
import { buildRedisKey, buildRedisValue } from "@src/persistence/cache.js";
import { stringify } from "safe-stable-stringify";
import { saveWithCache, loadWithCache } from "@src/persistence/cache.js";
import { UrlPlain as UrlSchema } from '@prismabox/Url.js';
import * as Domain from "@src/domain/url.js";


export const saveUrl = async (
    cacheKeys: Prisma.UrlWhereUniqueInput[],
    data: Prisma.UrlUncheckedCreateInput,
    { prisma, redis }: { prisma: PrismaClient, redis: Redis },
): Promise<Domain.Url> => {
    const redisCacheKeys = cacheKeys.map((key) => buildRedisKey('url', key));
    const redisValue = buildRedisValue(data);

    const createdUrl = await saveWithCache(redisCacheKeys, redisValue, { redis }, async () => {
        return prisma.url.create({ data });
    });
    return Domain.urlFromPersistence(createdUrl);
};

export const loadUrlBy = async (
    where: Prisma.UrlWhereUniqueInput,
    { prisma, redis }: { prisma: PrismaClient, redis: Redis },
): Promise<Domain.Url | null> => {
    const redisKey = buildRedisKey('url', where);

    const loaded = await loadWithCache(redisKey, { redis, redisSchema: UrlSchema }, async () => {
        return prisma.url.findUnique({ where });
    });

    if (loaded === null) {
        return null;
    }

    return Domain.urlFromPersistence(loaded);
};
