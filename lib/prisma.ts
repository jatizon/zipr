import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@generated/prisma/client.js";


const buildPrismaClient = (connectionString: string): PrismaClient => {
    const adapter = new PrismaBetterSqlite3({ url: connectionString }); 
    return new PrismaClient({ adapter });
};

export default buildPrismaClient;
