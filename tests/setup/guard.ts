import { assertEnvMatchesFileOrThrow } from '@src/config/env.js';


assertEnvMatchesFileOrThrow('.env.test', 'POSTGRES_DB');