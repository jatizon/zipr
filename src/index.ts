import fastify from 'fastify'
import { PrismaClient } from "@generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });


const SHORT_URL_LENGTH: number = 6;

const generateRandomString = (length: number) => {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };


const urls: Record<string, string> = {
    "abc123": "https://www.google.com/search?q=fastify",
    "def456": "https://github.com/prisma/prisma",
    "ghi789": "https://nodejs.org/en/about/",
    "jkl012": "https://fastify.dev/docs/latest/",
    "mno345": "https://typescriptlang.org/",
};

const BASE_URL = "zipr.josetizon.com"

const registerUrl = (url: string) => {
    let shortUrl = generateRandomString(SHORT_URL_LENGTH);
    while (shortUrl in urls)
        shortUrl = generateRandomString(SHORT_URL_LENGTH);
    urls[shortUrl] = url
    return shortUrl
}

const getFullUrl = (short_url: string) => {
    return urls[short_url]
}


const a = "https://aotouch.chibs/"

const b = registerUrl(a);

console.log(b);
console.log(urls);


