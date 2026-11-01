import { CACHE_TTL_SECONDS } from "@src/config/limits.js";


type CacheEntry = { value: string, expiresAt: number };

export class InMemoryCacheService {
    cacheHashmap: Map<string, CacheEntry>;

    constructor(){
        this.cacheHashmap = new Map();
    }

    get(key: string): string | null {
        const retrieved = this.cacheHashmap.get(key);

        if (retrieved === undefined)
            return null;

        if (retrieved.expiresAt <= Date.now()) {
            this.cacheHashmap.delete(key);
            return null;
        }

        return retrieved.value;
    }

    async set(keys: string[], value: string): Promise<void> {
        try {
            const expiresAt = Date.now() + CACHE_TTL_SECONDS * 1000;

            for (const key of keys)
                this.cacheHashmap.set(key, { value, expiresAt });
        }
        catch {
            // Do nothing
        }
    }
}
