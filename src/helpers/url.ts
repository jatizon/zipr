import { type FastifyInstance } from "fastify";
import { decodeBase62 } from "@src/helpers/base62Codec.js";
import { ShorteningTypes } from "@src/interfaces.js";
import { type PrismaClient } from "@generated/prisma/client.js";
import { MAX_SLUG_LENGTH } from "@src/config/limits.js";


const SLUG_PATTERN = new RegExp(`^[0-9a-zA-Z_-]{1,${MAX_SLUG_LENGTH}}$`);

const BASE62_PATTERN = /^[0-9a-zA-Z]+$/;

export const isSlugValid = (slug: string | undefined): boolean =>
    typeof slug === "string" && SLUG_PATTERN.test(slug);


export default async function getLongUrlFromShort(
    shorteningType: ShorteningTypes,
    shortUrl: string,
    prisma: PrismaClient, 
): Promise<string | null> {
    if (shorteningType === ShorteningTypes.Auto) {
        if (!BASE62_PATTERN.test(shortUrl))
            return null;

        const urlObjectId = decodeBase62(shortUrl);
        const urlObject = await prisma.url.findUnique({
            where: {id: urlObjectId},
        });
        return urlObject?.longUrl ?? null;
    }
    const urlObject = await prisma.url.findUnique({
        where: { 
            shortUrl_shorteningType: { 
                shortUrl: shortUrl, 
                shorteningType: shorteningType,
            } 
        }
    });
    return urlObject?.longUrl ?? null; 
};


export const customSlugCollidesWithRoute = (slug: string, fastify: FastifyInstance) => {
    const firstSegment = (path: string) => path.trim().split("/")[1] ?? "";

    const reservedSlugs = [...fastify.routes.keys()].map(firstSegment);

    return reservedSlugs.includes(slug);
};
