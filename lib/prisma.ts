import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";


type BuildPrismaClientParams = {
    testDbConnectionString: string;
    testSchema?: string;
};

const buildPrismaClient = ({ testDbConnectionString, testSchema = 'public' }: BuildPrismaClientParams) => {
    const adapter = new PrismaPg({ connectionString: testDbConnectionString }, { schema: testSchema });
    return new PrismaClient({ adapter });
};

export default buildPrismaClient;