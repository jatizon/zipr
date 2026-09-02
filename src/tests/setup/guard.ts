import { assertEnvMatchesFileOrThrow } from '@src/config/env.js';


assertEnvMatchesFileOrThrow('.env.test', 'DATABASE_URL');
assertEnvMatchesFileOrThrow('.env.test', 'TEMPLATE_DATABASE_PATH');