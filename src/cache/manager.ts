type CacheService = {
    set: (keys: string[], value: string) => void | Promise<void>
    get: (key: string) => (string| null) | Promise<string| null>
};

export class MultiLevelCacheManager {
    private readonly cacheServices: CacheService[] = [];

    constructor(cacheServices: CacheService[]) {
        this.cacheServices = cacheServices;
    }

    private async propagateValuesOnCaches(
        lowestUptodateCache: CacheService | null,
        keys: string[],
        value: string,
    ): Promise<void> {
        for (const cacheService of this.cacheServices) {
            if (cacheService === lowestUptodateCache)
                break;

            await cacheService.set(keys, value);
        }
    };

    async set(keys: string[], value: string) {
        await this.propagateValuesOnCaches(
            null, 
            keys, 
            value
        ).catch(() => {});;
    }

    async get(key: string): Promise<string | null> {
        let resolvedValue: string | null = null;
        let lowestUptodateCache: CacheService | null = null;

        for (const cacheService of this.cacheServices) {
            resolvedValue = await cacheService.get(key);

            if (resolvedValue !== null) {
                lowestUptodateCache = cacheService;
                break;
            }
        }
        
        if (resolvedValue === null) {
            return null;
        }

        void this.propagateValuesOnCaches(
            lowestUptodateCache, 
            [key], 
            resolvedValue,
        ).catch(() => {});;

        return resolvedValue;
    }
}