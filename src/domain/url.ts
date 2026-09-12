import { type ShorteningTypes } from "@src/interfaces.js";
import { type Prisma } from "@generated/prisma/client.js";


export type Url = {
    id: number;
    ownerId: number;
    longUrl: string;
    shortUrl: string;
    shorteningType: ShorteningTypes;
};

export const urlFromPersistence = (prismaUrl: Prisma.UrlModel): Url => ({
    id: prismaUrl.id,
    ownerId: prismaUrl.ownerId,
    longUrl: prismaUrl.longUrl,
    shortUrl: prismaUrl.shortUrl!,
    shorteningType: prismaUrl.shorteningType as ShorteningTypes,
});
