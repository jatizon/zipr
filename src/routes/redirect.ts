import { type TypeBoxFastifyInstance } from "@src/build.js";
import getLongUrlFromShort, { isSlugValid } from "@src/helpers/url.js";
import { ShorteningTypes, type Dependencies } from "@src/interfaces.js";
import * as Redirect from "@src/routes/types/redirect.types.js";


// Auto slugs are namespaced under /a so that a custom slug can own the root:
// "/a/2l" has two segments and "/meu-link" one, so the two routes never collide
// and the path alone tells the handler which lookup to run.
export default async function redirectRoutes(
    fastify: TypeBoxFastifyInstance,
    {prisma}: Dependencies
) {
    fastify.get("/a/:shortUrl", {
        schema: {params: Redirect.AutoParams}
    }, async (request, reply) => {
        if (!isSlugValid(request.params.shortUrl))
            return reply.badRequest("Invalid Url");

        const longUrl = await getLongUrlFromShort(
            ShorteningTypes.Auto,
            request.params.shortUrl,
            prisma,
        );
        if (longUrl === null)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(longUrl, 301);
    });

    fastify.get("/:shortUrl", {
        schema: {params: Redirect.CustomParams}
    }, async (request, reply) => {
        if (!isSlugValid(request.params.shortUrl))
            return reply.badRequest("Invalid Url");

        const longUrl = await getLongUrlFromShort(
            ShorteningTypes.Custom,
            request.params.shortUrl,
            prisma,
        );
        if (longUrl === null)
            return reply.notFound("Shortened Url not found");

        return reply.redirect(longUrl, 301);
    });
}
