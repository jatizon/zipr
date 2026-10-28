import "tsconfig-paths/register";
import "dotenv/config";
import { createTestDb } from "@tests/helpers/db.js";


export default async function globalSetup() {
    await createTestDb();
}
