import { type FastifyRequest, type FastifyInstance } from "fastify";
import { type Url } from "@generated/prisma/client.js";
import { prisma } from "@lib/prisma.js";
import { encodeBase62, decodeBase62 } from "@app/utils.js";
import isUrlHttp from "is-url-http";
import {
    ShorteningTypes,
    type ShortenBodyType,
    type TestEncodeParamsType,
    type TestDecodeParamsType,
    type RedirectParamsType,
} from "@app/interfaces.js";


export default async function rootRoutes(fastify: FastifyInstance) {
    fastify.get("/health", () => "healthy");

    fastify.post("/admin/test-encode", async (request: FastifyRequest<{ Body: TestEncodeParamsType}>, reply) => {
        return reply.code(200).send({encoded: encodeBase62(request.body.urlId)});
    });
    
    fastify.post("/admin/test-decode", async (request: FastifyRequest<{ Body: TestDecodeParamsType}>, reply) => {
        return reply.code(200).send({decoded: decodeBase62(request.body.shortUrl)});
    });
    
    fastify.post("/shorten", async (request: FastifyRequest<{ Body: ShortenBodyType}>, reply) => {
        if (request.body.shortening_type == ShorteningTypes.Auto && request.body.shortUrl !== undefined)
            return reply.code(400).send(fastify.httpErrors.badRequest("Cannot specify shortUrl in auto shorten method"));
    
        if (!isUrlHttp(request.body.longUrl))
            return reply.code(400).send(fastify.httpErrors.badRequest("Invalid Url"));
    
        const user = await prisma.user.findUnique({
            where: { id: request.body.ownerId },
        });
        if (user === null)
            return reply.code(404).send(fastify.httpErrors.notFound("User not found"));
    
        const url = await prisma.url.findUnique({
            where: { 
                id: request.body.ownerId,
                longUrl: request.body.longUrl,
            },
        });
        if (url !== null)
            return reply.code(409).send(fastify.httpErrors.conflict("You already registered this url"));
    
        let createdUrl: Url;
        let shortUrl: string;
    
        if (request.body.shortening_type == ShorteningTypes.Auto) {
            createdUrl = await prisma.url.create({
                data: {
                    ownerId: request.body.ownerId,
                    longUrl: request.body.longUrl,
                }
            });
            shortUrl = encodeBase62(createdUrl.id);
        }
    
        else {
            createdUrl = await prisma.url.create({
                data: {
                    ownerId: request.body.ownerId,
                    longUrl: request.body.longUrl,
                    shortUrl: request.body.shortUrl,
                }
            });
            shortUrl = encodeBase62(createdUrl.id);
        }
    
        return reply.code(201).send({shortUrl: shortUrl});
    });
    
    fastify.get("/:url", async (request: FastifyRequest<{ Params: RedirectParamsType}>, reply) => {
        if (!isUrlHttp(request.params.shortUrl))
            return reply.code(400).send(fastify.httpErrors.badRequest("Invalid Url"));
    
        let urlObject;
    
        if (request.params.shortening_type == ShorteningTypes.Auto) {
            const urlObjectId = decodeBase62(request.params.shortUrl);
            urlObject = await prisma.url.findUnique({
                where: {id: urlObjectId},
            });
            if (urlObject === null) {
                return reply.code(404).send();
            } 
        }
        
        else {
            urlObject = await prisma.url.findUnique({
                where: {shortUrl: request.params.shortUrl}
            });
            if (urlObject === null) {
                return reply.code(404).send();
            } 
        }
    
        const longUrl = urlObject.longUrl;
        return reply.redirect(longUrl, 301);
    }); 
}
