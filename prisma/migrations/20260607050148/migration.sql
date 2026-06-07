/*
  Warnings:

  - You are about to drop the `url` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "url";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "urls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER NOT NULL,
    "long_url" TEXT NOT NULL,
    "short_url" TEXT NOT NULL,
    CONSTRAINT "urls_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "urls_short_url_key" ON "urls"("short_url");

-- CreateIndex
CREATE INDEX "urls_owner_id_idx" ON "urls"("owner_id");
