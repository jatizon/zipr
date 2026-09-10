import { type TypeBoxFastifyInstance } from "@src/build.js";
import { encodeBase62 } from "@src/helpers/base62Codec.js";
import {
    ShorteningTypes,
    type Dependencies,
} from "@src/interfaces.js";
import isUrlHttp from "is-url-http";
import { customSlugCollidesWithRoute } from "@src/helpers/url.js";
import * as Shorten from "@src/routes/types/shorten.types.js";
import * as Auth from "@src/routes/types/auth.types.js";
import authHook from "@src/hooks/auth.js";
import resolveUser from "@src/hooks/helpers/resolveUser.js";
import { ensureTierIn } from "@src/helpers/authorization.js";
import { allowedTiersForRoute } from "@src/config/authorization.js";


export default async function shortenRoutes(
    fastify: TypeBoxFastifyInstance, 
    {prisma}: Dependencies,
) { 
    fastify.post("/auto", {
        schema: {
            body: Shorten.AutoBody,
            headers: Auth.AuthHeaders,
        },
        preHandler: authHook,
    }, async (request, reply) => {
        const user = await resolveUser(request.userId as number, prisma);

        if (user === null)
            return reply.notFound("User not found");

        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        const createdUrl = await prisma.url.create({
            data: {
                ownerId: user.id,
                longUrl: request.body.longUrl,
                shorteningType: ShorteningTypes.Auto,
            }
        });
        const shortUrl = encodeBase62(createdUrl.id);
        const updatedUrl = await prisma.url.update({
            where: { id: createdUrl.id },
            data: { shortUrl: shortUrl },
        });
        
        return reply.code(201).send({shortUrl: updatedUrl.shortUrl});
    });

    fastify.post("/custom", {
        schema: {
            body: Shorten.CustomBody,
            headers: Auth.AuthHeaders,
        },
        preHandler: authHook,
    }, async (request, reply) => {
        const user = await resolveUser(request.userId as number, prisma);

        if (user === null)
            return reply.notFound("User not found");

        if (!ensureTierIn(allowedTiersForRoute.shortenCustom, user))
            return reply.forbidden();

        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        const slugTaken = await prisma.url.count({
            where: { 
                shortUrl: request.body.shortUrl,
                shorteningType: ShorteningTypes.Custom,
            },
        }) > 0;
        if (slugTaken)
            return reply.conflict("Slug already taken");

        if (customSlugCollidesWithRoute(request.body.shortUrl, fastify))
            return reply.conflict("Slug already taken");

        const createdUrl = await prisma.url.create({
            data: {
                ownerId: user.id,
                longUrl: request.body.longUrl,
                shortUrl: request.body.shortUrl,
                shorteningType: ShorteningTypes.Custom,
            }
        });

        return reply.code(201).send({shortUrl: createdUrl.shortUrl});
    });
}

