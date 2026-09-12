import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/prisma/client.js";


type BuildPrismaClientParams = {
    connectionString: string;
    schema?: string;
};

const buildPrismaClient = ({ connectionString, schema = 'public' }: BuildPrismaClientParams) => {
    const adapter = new PrismaPg({ connectionString, options: `-c search_path="${schema}"` }, { schema });
    return new PrismaClient({ adapter });
};

export default buildPrismaClient;