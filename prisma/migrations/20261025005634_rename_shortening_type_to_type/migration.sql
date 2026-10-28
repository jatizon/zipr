-- DropIndex
DROP INDEX "urls_shortUrl_shorteningType_key";

-- AlterTable
ALTER TABLE "urls" DROP COLUMN "shorteningType",
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "urls_shortUrl_type_key" ON "urls"("shortUrl", "type");

