import Fastify, { type FastifyRequest } from 'fastify';
import { type User } from "@generated/prisma/client.js";
import { prisma } from "@lib/prisma.js";
import { encodeBase62, decodeBase62 } from "@zipr/src/utils.js";
import isUrlHttp from 'is-url-http';
import sensible from '@fastify/sensible';



const fastify = Fastify({
    logger: true
});

fastify.register(sensible);


const SHORT_URL_LENGTH: number = 6;

const upsertUrl = async (owner: User, longUrl: string) => {
    return await prisma.url.upsert({
        where: {
            ownerId_longUrl: {
                ownerId: owner.id,
                longUrl: longUrl,
            },
        },
        update: {},
        create: { 
            ownerId: owner.id, 
            longUrl: longUrl, 
        },
      });
};

const upsertUser = async (name: string, email: string) => {
    return await prisma.user.upsert({
        where: { email: email},
        update: {},
        create: {
            name: name,
            email: email,
        }
    });
};

// const registerUser = async (name: string, email: string) => {
//     return await prisma.user.create({
//         data: {
//             name: name,
//             email: email,
//         }
//     });
// };


const user = await upsertUser("teste", "teste@gmail.com");

const urls: Record<string, string> = {
    "a": "https://www.google.com",
    "abc123": "https://www.google.com/search?q=fastify",
    "def456": "https://github.com/prisma/prisma",
    "ghi789": "https://nodejs.org/en/about/",
    "jkl012": "https://fastify.dev/docs/latest/",
    "mno345": "https://typescriptlang.org/",
    "pqr678": "https://expressjs.com/",
    "stu901": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "vwx234": "https://www.npmjs.com/",
    "yzA567": "https://react.dev/",
    "Bcd890": "https://vuejs.org/",
    "Efg123": "https://angular.io/",
    "Hij456": "https://rxjs.dev/",
    "Klm789": "https://jestjs.io/",
    "Nop012": "https://playwright.dev/",
    "Qrs345": "https://vitest.dev/",
    "Tuv678": "https://www.postgresql.org/",
    "Wxy901": "https://www.sqlite.org/index.html",
    "Zab234": "https://deno.com/",
    "Cde567": "https://bun.sh/",
    "Fgh890": "https://github.com/jose-tizon/zipr"
};

for (const shortUrl in urls) {
    const longUrl = urls[shortUrl];
    const url = upsertUrl(user, longUrl!);
}

interface RedirectParamsType {
    url: string,
} 

interface ShortenBodyType {
    ownerId: number,
    longUrl: string,
} 

interface TestEncodeParamsType {
    urlId: number,
}

interface TestDecodeParamsType {
    shortUrl: string,
}


fastify.get('/health', () => "healthy");

fastify.post('/admin/test-encode', async (request: FastifyRequest<{ Body: TestEncodeParamsType}>, reply) => {
    reply.code(200).send({encoded: encodeBase62(request.body.urlId)});
});

fastify.post('/admin/test-decode', async (request: FastifyRequest<{ Body: TestDecodeParamsType}>, reply) => {
    reply.code(200).send({decoded: decodeBase62(request.body.shortUrl)});
});

fastify.post('/shorten', async (request: FastifyRequest<{ Body: ShortenBodyType}>, reply) => {
    if (!isUrlHttp(request.url))
        reply.code(400).send(fastify.httpErrors.badRequest('Invalid Url'));

    const user = await prisma.user.findUnique({
        where: { id: request.body.ownerId },
    });
    if (user === null)
        reply.code(404).send(fastify.httpErrors.notFound('User not found'));

    const url = await prisma.url.findUnique({
        where: { 
            id: request.body.ownerId,
            longUrl: request.body.longUrl,
        },
    });
    if (url === null)
        reply.code(409).send(fastify.httpErrors.conflict('You already registered this url'));

    const createdUrl = await prisma.url.create({
        data: {
            ownerId: request.body.ownerId,
            longUrl: request.body.longUrl,
        }
    });

    reply.code(201).send({shortUrl: encodeBase62(createdUrl.id)});
});


fastify.get('/:url', async (request: FastifyRequest<{ Params: RedirectParamsType}>, reply) => {
    const shortUrl = request.params.url;

    const urlObjectId = decodeBase62(shortUrl);
    const urlObject = await prisma.url.findUnique({
        where: {id: urlObjectId},
    });
    if (urlObject === null) {
        reply.code(404);
        return;
    } 
    
    const longUrl = urlObject.longUrl;

    reply.redirect(longUrl, 301);
}); 




const start = async () => {
    try {
      await fastify.listen({ port: 3000 });
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
};
start();



