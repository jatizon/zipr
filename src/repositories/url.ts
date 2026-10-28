import { type PrismaClient, type Prisma } from "@generated/prisma/client.js";
import { buildCacheKey, buildCacheValue } from "@src/helpers/cache.js";
import { type MultiLevelCacheManager } from "@src/cache/manager.js";
import { type ShorteningTypes } from "@src/interfaces.js";
import { Database } from "@src/database/index.js";
import { Domain } from "@src/domain/index.js";
import { urlDomainFromDatabase } from "@src/domain/url.js";
import { parseAndValidateJson } from "@src/helpers/parsing.js";


export const saveUrl = async (
    data: Prisma.UrlUncheckedCreateInput,
    keys: { identifier: string, value: string }[],
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.Url> => {
    const created = await prisma.url.create({ data });

    const cacheKeys = keys.map(({ identifier, value }) => buildCacheKey('url', identifier, value));
    const cacheValue = buildCacheValue(created);

    void cacheManager.set(cacheKeys, cacheValue);

    return urlDomainFromDatabase(created);
};

export const loadUrlById = async (
    id: number,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.Url | null> => {
    const cacheKey = buildCacheKey('url', 'id', String(id));

    let loaded: Database.Url | null = null;

    const loadedRawString = await cacheManager.get(cacheKey);
    if (loadedRawString !== null)
        loaded = parseAndValidateJson(loadedRawString, Database.Url);    

    if (loaded === null) {
        loaded = await prisma.url.findUnique({ where: { id } });

        if (loaded !== null) {
            const cacheValue = buildCacheValue(loaded);
            
            void cacheManager.set([cacheKey], cacheValue);
        }
    }

    if (loaded === null)
        return null;

    return urlDomainFromDatabase(loaded);
};

export const loadUrlByShortUrlAndType = async (
    shortUrl: string,
    type: ShorteningTypes,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.Url | null> => {
    const cacheKey = buildCacheKey('url', `shortUrl_${type}`, shortUrl);

    let loaded: Database.Url | null = null;

    const loadedRawString = await cacheManager.get(cacheKey);
    if (loadedRawString !== null)
        loaded = parseAndValidateJson(loadedRawString, Database.Url);

    if (loaded === null) {
        loaded = await prisma.url.findUnique({ where: { shortUrl_type: { shortUrl, type } } });

        if (loaded !== null)
            void cacheManager.set([cacheKey], buildCacheValue(loaded));
    }

    if (loaded === null)
        return null;

    return urlDomainFromDatabase(loaded);
};
