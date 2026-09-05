import { Client, Pool } from "pg";


export const buildPostgresPool = (connectionString: string) => {
    const pool = new Pool({
        connectionString,
    });

    return pool;
};