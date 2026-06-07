import Fastify, { type FastifyRequest } from 'fastify';
import { PrismaClient, type User} from "@generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { generateRandomString } from "@zipr/src/utils.js";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });


const fastify = Fastify({
    logger: true
});


const SHORT_URL_LENGTH: number = 6;

const upsertUrl = async (owner: User, longUrl: string, shortUrl: string) => {
    return await prisma.url.upsert({
        where: { shortUrl: shortUrl},
        update: {},
        create: { 
            ownerId: owner.id, 
            shortUrl: shortUrl,
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

// const registerUrl = async (owner: User, longUrl: string, shortUrl: string) => {
//     return await prisma.url.create({
//         data: {
//             ownerId: owner.id,
//             longUrl: longUrl,
//             shortUrl: shortUrl,
//         }
//     });
// };

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
    const url = upsertUrl(user, longUrl!, shortUrl);
}

interface RedirectBodyType {
    url: string,
} 

fastify.get('/redirect/:url', async (request: FastifyRequest<{ Params: RedirectBodyType}>, reply) => {
    const shortUrl = request.params.url;
    const urlObject = await prisma.url.findUnique({
        where: {shortUrl: shortUrl},
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



