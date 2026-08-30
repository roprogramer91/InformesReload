-- CreateTable
CREATE TABLE "Institution" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "template" TEXT NOT NULL,
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "dniRequired" BOOLEAN NOT NULL DEFAULT false,
    "showDni" BOOLEAN NOT NULL DEFAULT false
);
