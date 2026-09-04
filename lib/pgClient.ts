import { Client, Pool } from "pg";


export const buildPostgresPool = (connectionString: string) => {
    const pool = new Pool({
        connectionString,
    });

    // Idle clients can still emit errors from the server (e.g. a forced
    // disconnect via DROP DATABASE ... WITH (FORCE)); without a listener here
    // Node treats that as an unhandled 'error' event and crashes the process.
    pool.on('error', (err) => {
        console.error('[pg pool error]', err.message);
    });

    return pool;
};