import autocannon from "autocannon";


type AutocannonBaseConfig =
    Omit<autocannon.Options, 'url' | 'method'> & {
        baseUrl: string;
    };

type AutocannonRequest =
    Omit<autocannon.Options, 'url' | 'method'> & {
        path?: string;
    };

const createAutocannonRunner = (baseConfig: AutocannonBaseConfig) => {
    const buildUrl = (path?: string) => new URL(path ?? '', baseConfig.baseUrl).toString();

    return {
        baseConfig,

        async get({ path, ...overrides }: AutocannonRequest = {}) {
            return await autocannon({
                ...baseConfig,
                ...overrides,
                method: 'GET',
                url: buildUrl(path),
            });
        },

        async post({ path, ...overrides }: AutocannonRequest = {}) {
            return await autocannon({
                ...baseConfig,
                ...overrides,
                method: 'POST',
                url: buildUrl(path),
            });
        },

        async put({ path, ...overrides }: AutocannonRequest = {}) {
            return await autocannon({
                ...baseConfig,
                ...overrides,
                method: 'PUT',
                url: buildUrl(path),
            });
        },

        async patch({ path, ...overrides }: AutocannonRequest = {}) {
            return await autocannon({
                ...baseConfig,
                ...overrides,
                method: 'PATCH',
                url: buildUrl(path),
            });
        },

        async delete({ path, ...overrides }: AutocannonRequest = {}) {
            return await autocannon({
                ...baseConfig,
                ...overrides,
                method: 'DELETE',
                url: buildUrl(path),
            });
        },
    };
};

export default createAutocannonRunner;
