/*
  Warnings:

  - You are about to drop the column `shortUrl` on the `urls` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_urls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "longUrl" TEXT NOT NULL,
    CONSTRAINT "urls_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_urls" ("id", "longUrl", "ownerId") SELECT "id", "longUrl", "ownerId" FROM "urls";
DROP TABLE "urls";
ALTER TABLE "new_urls" RENAME TO "urls";
CREATE INDEX "urls_ownerId_idx" ON "urls"("ownerId");
CREATE UNIQUE INDEX "urls_ownerId_longUrl_key" ON "urls"("ownerId", "longUrl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
