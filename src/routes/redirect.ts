import { type TypeBoxFastifyInstance } from "@src/build.js";
import { isSlugValid, isSlugBase62, isSlugWithinIdRange } from "@src/helpers/url.js";
import { decodeBase62 } from "@src/helpers/base62Codec.js";
import { ShorteningTypes, type Dependencies } from "@src/interfaces.js";
import * as Redirect from "@src/routes/types/redirect.types.js";
import { loadUrlById, loadUrlByShortUrlAndType } from "@src/repositories/url.js";


export default async function redirectRoutes(
    fastify: TypeBoxFastifyInstance,
    { prisma, cacheManager }: Dependencies
) {
    fastify.get("/a/:shortUrl", {
        schema: {
            tags: ["redirect"],
            summary: "Redirect an auto short URL",
            params: Redirect.AutoParams,
            response: { 301: Redirect.RedirectResponse },
        },
    }, async (request, reply) => {
        const isShortUrlValid = (
            isSlugValid(request.params.shortUrl) &&
            isSlugBase62(request.params.shortUrl) &&
            isSlugWithinIdRange(request.params.shortUrl)
        );
        if (!isShortUrlValid)
            return reply.badRequest("Invalid Url");

        const urlId = decodeBase62(request.params.shortUrl);

        const urlObject = await loadUrlById(urlId, { prisma, cacheManager });

        // Auto and Custom rows share the id column; only Auto ones are meant to be reached by id.
        if (urlObject === null || urlObject.type !== ShorteningTypes.Auto)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(urlObject.longUrl, 301);
    });

    fastify.get("/:shortUrl", {
        schema: {
            tags: ["redirect"],
            summary: "Redirect a custom short URL",
            params: Redirect.CustomParams,
            response: { 301: Redirect.RedirectResponse },
        },
    }, async (request, reply) => {
        if (!isSlugValid(request.params.shortUrl))
            return reply.badRequest("Invalid Url");

        const urlObject = await loadUrlByShortUrlAndType(
            request.params.shortUrl,
            ShorteningTypes.Custom,
            { prisma, cacheManager },
        );

        if (urlObject === null)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(urlObject.longUrl, 301);
    });
}
