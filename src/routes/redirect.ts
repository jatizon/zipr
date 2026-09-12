import { type TypeBoxFastifyInstance } from "@src/build.js";
import { isSlugValid, isSlugBase62, isSlugWithinIdRange } from "@src/helpers/url.js";
import { decodeBase62 } from "@src/helpers/base62Codec.js";
import { ShorteningTypes, type Dependencies } from "@src/interfaces.js";
import * as Redirect from "@src/routes/types/redirect.types.js";
import { loadUrlBy } from "@src/repositories/url.js";


export default async function redirectRoutes(
    fastify: TypeBoxFastifyInstance,
    { prisma, redis }: Dependencies
) {
    fastify.get("/a/:shortUrl", {
        schema: { params: Redirect.AutoParams }
    }, async (request, reply) => {
        const isShortUrlValid = (
            isSlugValid(request.params.shortUrl) &&
            isSlugBase62(request.params.shortUrl) &&
            isSlugWithinIdRange(request.params.shortUrl)
        );
        if (!isShortUrlValid)
            return reply.badRequest("Invalid Url");

        const urlId = decodeBase62(request.params.shortUrl);

        const urlObject = await loadUrlBy({ id: urlId }, { prisma, redis });

        if (urlObject === null)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(urlObject.longUrl, 301);
    });

    fastify.get("/:shortUrl", {
        schema: { params: Redirect.CustomParams }
    }, async (request, reply) => {
        if (!isSlugValid(request.params.shortUrl))
            return reply.badRequest("Invalid Url");

        const urlObject = await loadUrlBy(
            {
                shortUrl_shorteningType: {
                    shortUrl: request.params.shortUrl,
                    shorteningType: ShorteningTypes.Custom,
                },
            },
            { prisma, redis },
        );

        if (urlObject === null)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(urlObject.longUrl, 301);
    });
}
