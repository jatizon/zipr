import { type FastifyInstance } from "fastify";
import { MAX_SLUG_LENGTH, POSTGRES_INT4_MAX } from "@src/config/limits.js";
import { encodeBase62, BASE62_ALPHABET } from "@src/helpers/base62Codec.js";


const SLUG_PATTERN = new RegExp(`^[0-9a-zA-Z_-]{1,${MAX_SLUG_LENGTH}}$`);

const BASE62_PATTERN = /^(0|[1-9a-zA-Z][0-9a-zA-Z]*)$/;

export const MAX_AUTO_ID_SLUG = encodeBase62(POSTGRES_INT4_MAX);

export const isSlugValid = (slug: string) => {
    return (typeof slug === "string") && SLUG_PATTERN.test(slug);
};

export const isSlugBase62 = (slug: string) => {
    return BASE62_PATTERN.test(slug);
};

export const isSlugWithinIdRange = (slug: string) => {
    if (slug.length !== MAX_AUTO_ID_SLUG.length)
        return slug.length < MAX_AUTO_ID_SLUG.length;

    for (let i = 0; i < slug.length; i++) {
        const digit = BASE62_ALPHABET.indexOf(slug[i]!);
        const maxDigit = BASE62_ALPHABET.indexOf(MAX_AUTO_ID_SLUG[i]!);
        if (digit !== maxDigit)
            return digit < maxDigit;
    }

    return true;
};

export const customSlugCollidesWithRoute = (slug: string, fastify: FastifyInstance) => {
    const firstSegment = (path: string) => path.trim().split("/")[1] ?? "";

    const reservedSlugs = [...fastify.routes.keys()].map(firstSegment);

    return reservedSlugs.includes(slug);
};
