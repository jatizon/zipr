import { type TypeBoxFastifyInstance } from "@src/build.js";
import { encodeBase62 } from "@src/helpers/base62Codec.js";
import {
    ShorteningTypes,
    type Dependencies,
} from "@src/interfaces.js";
import isUrlHttp from "is-url-http";
import { customSlugCollidesWithRoute, isSlugValid } from "@src/helpers/url.js";
import * as Shorten from "@src/routes/types/shorten.types.js";
import * as Auth from "@src/routes/types/auth.types.js";
import authHook from "@src/hooks/auth.js";
import { ensureTierIn } from "@src/helpers/authorization.js";
import { allowedTiersForRoute } from "@src/config/authorization.js";
import { loadUrlByShortUrlAndType, saveUrl } from "@src/repositories/url.js";
import { loadUserById } from "@src/repositories/user.js";
import { getAndConsumeNextId } from "@src/database/postgres.js";


export default async function shortenRoutes(
    fastify: TypeBoxFastifyInstance,
    { prisma, cacheManager }: Dependencies,
) {
    fastify.post("/auto", {
        schema: {
            tags: ["shorten"],
            summary: "Create an auto short URL",
            body: Shorten.AutoBody,
            headers: Auth.AuthHeaders,
            response: { 201: Shorten.CreatedResponse },
        },
        preHandler: authHook,
    }, async (request, reply) => {
        const user = await loadUserById(request.userId as number, { prisma, cacheManager });

        if (user === null)
            return reply.notFound("User not found");

        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        const id = await getAndConsumeNextId(prisma);
        const shortUrl = encodeBase62(id);

        const createdUrl = await saveUrl(
            {
                id,
                ownerId: user.id,
                longUrl: request.body.longUrl,
                shortUrl,
                type: ShorteningTypes.Auto,
            },
            { prisma, cacheManager },
        );

        return reply.code(201).send({ shortUrl: createdUrl.shortUrl });
    });

    fastify.post("/custom", {
        schema: {
            tags: ["shorten"],
            summary: "Create a custom short URL (Pro)",
            body: Shorten.CustomBody,
            headers: Auth.AuthHeaders,
            response: { 201: Shorten.CreatedResponse },
        },
        preHandler: authHook,
    }, async (request, reply) => {
        const user = await loadUserById(request.userId as number, { prisma, cacheManager });

        if (user === null)
            return reply.notFound("User not found");

        if (!ensureTierIn(allowedTiersForRoute.shortenCustom, user))
            return reply.forbidden();

        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        // Before the collision check: the empty slug also "collides" with the root route.
        if (!isSlugValid(request.body.shortUrl))
            return reply.badRequest("Invalid slug");

        const slugTaken = await loadUrlByShortUrlAndType(
            request.body.shortUrl,
            ShorteningTypes.Custom,
            { prisma, cacheManager },
        ) !== null;
        if (slugTaken)
            return reply.conflict("Slug already taken");

        if (customSlugCollidesWithRoute(request.body.shortUrl, fastify))
            return reply.conflict("Slug already taken");

        await saveUrl(
            {
                ownerId: user.id,
                longUrl: request.body.longUrl,
                shortUrl: request.body.shortUrl,
                type: ShorteningTypes.Custom,
            },
            { prisma, cacheManager },
        );

        return reply.code(201).send({ shortUrl: request.body.shortUrl });
    });
}

