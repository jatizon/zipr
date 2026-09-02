
import { type TypeBoxFastifyInstance } from "@src/build.js";
import { encodeBase62, decodeBase62 } from "@src/helpers/base62Codec.js";
import * as Admin from "@src/routes/types/admin.types.js";


export default async function adminRoutes(fastify: TypeBoxFastifyInstance) {
    fastify.post("/test-encode", {
        schema: {body: Admin.EncodeBody}
    }, async (request, reply) => {
        return reply.code(200).send({encoded: encodeBase62(request.body.urlId)});
    });

    fastify.post("/test-decode", {
        schema: {body: Admin.DecodeBody}
    }, async (request, reply) => {
        return reply.code(200).send({decoded: decodeBase62(request.body.shortUrl)});
    });
}