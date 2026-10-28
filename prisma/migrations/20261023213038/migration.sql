/*
  Warnings:

  - Made the column `shortUrl` on table `urls` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "urls" ALTER COLUMN "shortUrl" SET NOT NULL;
