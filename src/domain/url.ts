import { type ShorteningTypes } from "@src/interfaces.js";
import { type Prisma } from "@generated/prisma/client.js";
import { type Url } from "./types.js";


export const urlDomainFromDatabase = (prismaUrl: Prisma.UrlModel): Url => ({
    id: prismaUrl.id,
    ownerId: prismaUrl.ownerId,
    longUrl: prismaUrl.longUrl,
    shortUrl: prismaUrl.shortUrl!,
    type: prismaUrl.type as ShorteningTypes,
});
