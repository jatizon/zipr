-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urls" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "longUrl" TEXT NOT NULL,
    "shortUrl" TEXT,
    "shorteningType" TEXT NOT NULL,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "urls_ownerId_idx" ON "urls"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "urls_shortUrl_shorteningType_key" ON "urls"("shortUrl", "shorteningType");

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
