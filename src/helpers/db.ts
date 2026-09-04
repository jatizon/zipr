type BuildPostgresConnectionStringParams = {
    postgresUser: string,
    postgresPassword: string,
    postgresHost: string,
    postgresPort: number,
    postgresDb: string,
};

export const buildConnectionString = ({
    postgresUser,
    postgresPassword,
    postgresHost,
    postgresPort,
    postgresDb,
}: BuildPostgresConnectionStringParams) => {
    return `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`;
};