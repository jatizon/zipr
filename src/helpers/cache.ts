import { stringify } from "safe-stable-stringify";


export const buildCacheKey = (resource: string, identifier: string, value: string) => {
    return `${resource}:${identifier}:${value}`;
};

export const buildCacheValue = (value: object) => {
    return stringify(value);
};