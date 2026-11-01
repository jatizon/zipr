import { type PrismaClient, type Prisma } from "@generated/prisma/client.js";
import { buildCacheKey, buildCacheValue } from "@src/helpers/cache.js";
import { type MultiLevelCacheManager } from "@src/cache/manager.js";
import { type ShorteningTypes } from "@src/interfaces.js";
import { Database } from "@src/database/index.js";
import { Domain } from "@src/domain/index.js";
import { urlDomainFromDatabase } from "@src/domain/url.js";
import { parseAndValidateJson } from "@src/helpers/parsing.js";


const buildIdCacheKey = (id: number) => buildCacheKey('url', 'id', String(id));
const buildShortUrlCacheKey = (shortUrl: string, type: string) => buildCacheKey('url', `shortUrl_${type}`, shortUrl);

export const saveUrl = async (
    data: Prisma.UrlUncheckedCreateInput,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.Url> => {
    const created = await prisma.url.create({ data });

    const cacheKeys = [
        buildIdCacheKey(created.id),
        buildShortUrlCacheKey(created.shortUrl, created.type),
    ];

    void cacheManager.set(cacheKeys, buildCacheValue(created));

    return urlDomainFromDatabase(created);
};

export const loadUrlById = async (
    id: number,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.Url | null> => {
    const cacheKey = buildIdCacheKey(id);

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
    const cacheKey = buildShortUrlCacheKey(shortUrl, type);

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
