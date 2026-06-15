import Fastify, { type FastifyInstance } from "fastify";
import sensible from "@fastify/sensible";


const buildFastify = (): FastifyInstance => {
    const fastify = Fastify({
        logger: true
    });
    fastify.register(sensible);
    return fastify;
};

export { buildFastify };


// const SHORT_URL_LENGTH: number = 6;

// const upsertUrl = async (owner: User, longUrl: string, shortUrl: string) => {
//     return await prisma.url.upsert({
//         where: {
//             ownerId_longUrl: {
//                 ownerId: owner.id,
//                 longUrl: longUrl,
//             },
//         },
//         update: {},
//         create: { 
//             ownerId: owner.id, 
//             longUrl: longUrl, 
//         },
//       });
// };

// const upsertUser = async (name: string, email: string) => {
//     return await prisma.user.upsert({
//         where: { email: email},
//         update: {},
//         create: {
//             name: name,
//             email: email,
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


// const user = await upsertUser("teste", "teste@gmail.com");

// const urls: Record<string, string> = {eturnType<typeof Fastify>
//     "def456": "https://github.com/prisma/prisma",
//     "ghi789": "https://nodejs.org/en/about/",
//     "jkl012": "https://fastify.dev/docs/latest/",
//     "mno345": "https://typescriptlang.org/",
//     "pqr678": "https://expressjs.com/",
//     "stu901": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
//     "vwx234": "https://www.npmjs.com/",
//     "yzA567": "https://react.dev/",
//     "Bcd890": "https://vuejs.org/",
//     "Efg123": "https://angular.io/",
//     "Hij456": "https://rxjs.dev/",
//     "Klm789": "https://jestjs.io/",
//     "Nop012": "https://playwright.dev/",
//     "Qrs345": "https://vitest.dev/",
//     "Tuv678": "https://www.postgresql.org/",
//     "Wxy901": "https://www.sqlite.org/index.html",
//     "Zab234": "https://deno.com/",
//     "Cde567": "https://bun.sh/",
//     "Fgh890": "https://github.com/jose-tizon/zipr"
// };

// for (const shortUrl in urls) {
//     const longUrl = urls[shortUrl];
//     const url = upsertUrl(user, longUrl!);
// }


