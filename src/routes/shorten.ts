import { type TypeBoxFastifyInstance } from "@src/build.js";
import { encodeBase62 } from "@src/helpers/base62Codec.js";
import {
    ShorteningTypes,
    type Dependencies,
} from "@src/interfaces.js";
import isUrlHttp from "is-url-http";
import { customSlugCollidesWithRoute } from "@src/helpers/url.js";
import * as Shorten from "@src/routes/types/shorten.types.js";


export default async function shortenRoutes(
    fastify: TypeBoxFastifyInstance, 
    {prisma}: Dependencies,
) { 
    fastify.post("/auto", {
        schema: {body: Shorten.AutoBody}
    }, async (request, reply) => {
        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        const userDoesNotExists = await prisma.user.count({
            where: { id: request.body.ownerId },
        }) == 0;
        if (userDoesNotExists)
            return reply.notFound("User not found");

        const createdUrl = await prisma.url.create({
            data: {
                ownerId: request.body.ownerId,
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
        schema: {body: Shorten.CustomBody}
    }, async (request, reply) => {
        if (!isUrlHttp(request.body.longUrl))
            return reply.badRequest("Invalid Url");

        const userExists = await prisma.user.count({
            where: { id: request.body.ownerId },
        }) > 0;
        if (!userExists)
            return reply.notFound("User not found");

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
                ownerId: request.body.ownerId,
                longUrl: request.body.longUrl,
                shortUrl: request.body.shortUrl,
                shorteningType: ShorteningTypes.Custom,
            }
        });

        return reply.code(201).send({shortUrl: createdUrl.shortUrl});
    });
}

