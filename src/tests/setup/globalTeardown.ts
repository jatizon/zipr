import "tsconfig-paths/register";
import "dotenv/config";
import { removeTestDatabases } from "@src/tests/helpers/db.js";


export default function globalTeardown() {
    removeTestDatabases();
}
