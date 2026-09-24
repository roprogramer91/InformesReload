-- CreateTable
CREATE TABLE "GoogleAuthToken" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountKey" TEXT NOT NULL DEFAULT 'default',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleAuthToken_provider_idx" ON "GoogleAuthToken"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAuthToken_provider_accountKey_key" ON "GoogleAuthToken"("provider", "accountKey");
