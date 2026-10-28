
export class InMemoryCacheService {
    cacheHashmap: Map<string, string>;

    constructor(){
        this.cacheHashmap = new Map();
    }

    get(key: string): string | null {
        const retrieved = this.cacheHashmap.get(key);

        if (retrieved === undefined)
            return null;

        return retrieved;
    }

    async set(keys: string[], value: string): Promise<void> {
        try {
            for (const key of keys)
                this.cacheHashmap.set(key, value);
        }
        catch {
            // Do nothing
        }
    }
}