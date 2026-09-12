import type { PrismaClient } from "@generated/prisma/client.js";

type BuildPostgresConnectionStringParams = {
    postgresUser: string,
    postgresPassword: string,
    postgresHost: string,
    postgresPort: number,
    postgresDb: string,
};

export const buildPostgresConnectionString = ({
    postgresUser,
    postgresPassword,
    postgresHost,
    postgresPort,
    postgresDb,
}: BuildPostgresConnectionStringParams) => {
    return `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`;
};

export const getAndConsumeNextId = async (prisma: PrismaClient) => {
    const [{ id: nextId }] = await prisma.$queryRaw<[{ id: bigint }]>`
        SELECT nextval(pg_get_serial_sequence('urls', 'id')) AS id
    `;

    return Number(nextId);
};
