import { type PrismaClient, type Prisma } from "@generated/prisma/client.js";
import { buildCacheKey, buildCacheValue } from "@src/helpers/cache.js";
import { type MultiLevelCacheManager } from "@src/cache/manager.js";
import { Database } from "@src/database/index.js";
import { Domain } from "@src/domain/index.js";
import { userDomainFromDatabase } from "@src/domain/user.js";
import { parseAndValidateJson } from "@src/helpers/parsing.js";


export const saveUser = async (
    data: Prisma.UserUncheckedCreateInput,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.User> => {
    const created = await prisma.user.create({ data });
    const user = userDomainFromDatabase(created);

    const cacheKeys = [
        buildCacheKey('user', 'id', String(user.id)),
        buildCacheKey('user', 'email', user.email),
    ];

    void cacheManager.set(cacheKeys, buildCacheValue(user));

    return user;
};

export const loadUserById = async (
    id: number,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.User | null> => {
    const cacheKey = buildCacheKey('user', 'id', String(id));

    let user: Domain.User | null = null;

    const cachedRawString = await cacheManager.get(cacheKey);
    if (cachedRawString !== null)
        user = parseAndValidateJson(cachedRawString, Domain.User);

    if (user === null) {
        const loaded = await prisma.user.findUnique({ where: { id } });

        if (loaded === null)
            return null;

        user = userDomainFromDatabase(loaded);
        void cacheManager.set([cacheKey], buildCacheValue(user));
    }

    return user;
};

export const loadUserByEmail = async (
    email: string,
    { prisma, cacheManager }: { prisma: PrismaClient, cacheManager: MultiLevelCacheManager },
): Promise<Domain.User | null> => {
    const cacheKey = buildCacheKey('user', 'email', email);

    let user: Domain.User | null = null;

    const cachedRawString = await cacheManager.get(cacheKey);
    if (cachedRawString !== null)
        user = parseAndValidateJson(cachedRawString, Domain.User);

    if (user === null) {
        const loaded = await prisma.user.findUnique({ where: { email } });

        if (loaded === null)
            return null;

        user = userDomainFromDatabase(loaded);
        void cacheManager.set([cacheKey], buildCacheValue(user));
    }

    return user;
};

export const loadUserWithPasswordHashByEmail = async (
    email: string,
    { prisma }: { prisma: PrismaClient },
): Promise<Database.User | null> => {
    return prisma.user.findUnique({ where: { email } });
};
