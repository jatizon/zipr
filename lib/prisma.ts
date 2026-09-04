import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";


const buildPrismaClient = (connectionString: string, schema: string = 'public') => {
    const adapter = new PrismaPg({ connectionString }, { schema }); 
    return new PrismaClient({ adapter });
};

export default buildPrismaClient;