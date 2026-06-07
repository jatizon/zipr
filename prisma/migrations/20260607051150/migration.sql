/*
  Warnings:

  - You are about to drop the column `long_url` on the `urls` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `urls` table. All the data in the column will be lost.
  - You are about to drop the column `short_url` on the `urls` table. All the data in the column will be lost.
  - Added the required column `longUrl` to the `urls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `urls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shortUrl` to the `urls` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_urls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "longUrl" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    CONSTRAINT "urls_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_urls" ("id") SELECT "id" FROM "urls";
DROP TABLE "urls";
ALTER TABLE "new_urls" RENAME TO "urls";
CREATE UNIQUE INDEX "urls_shortUrl_key" ON "urls"("shortUrl");
CREATE INDEX "urls_ownerId_idx" ON "urls"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
