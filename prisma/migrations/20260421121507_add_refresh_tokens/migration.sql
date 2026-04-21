-- CreateTable
CREATE TABLE "refreshToken" (
    "token" TEXT NOT NULL,
    "userid" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "refreshToken_token_key" ON "refreshToken"("token");
