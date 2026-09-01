-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "template" TEXT NOT NULL,
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "dniRequired" BOOLEAN NOT NULL DEFAULT false,
    "showDni" BOOLEAN NOT NULL DEFAULT false,
    "dniMode" TEXT NOT NULL DEFAULT 'OPTIONAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");
