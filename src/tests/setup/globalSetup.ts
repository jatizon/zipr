import "tsconfig-paths/register";
import "dotenv/config";
import { setupTemplateDb } from "@src/tests/helpers/db.js";


export default function globalSetup() {
    setupTemplateDb();
}
