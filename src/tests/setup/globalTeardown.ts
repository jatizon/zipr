import "tsconfig-paths/register";
import "dotenv/config";
import { dropTestDb, closeDbConnections } from "@src/tests/helpers/db.js";


export default async function globalTeardown() {
    // await dropTestDb();
    await closeDbConnections();
}
