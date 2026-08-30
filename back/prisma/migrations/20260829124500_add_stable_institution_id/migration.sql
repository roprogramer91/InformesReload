-- RedefineTables
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "template" TEXT NOT NULL,
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "dniRequired" BOOLEAN NOT NULL DEFAULT false,
    "showDni" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Institution" ("id", "name", "active", "template", "hasCover", "dniRequired", "showDni", "createdAt", "updatedAt")
SELECT
    CASE "name"
        WHEN 'consultoriosMedicos' THEN 'inst_01_consultorios_medicos'
        WHEN 'vitalNorte' THEN 'inst_02_vital_norte'
        WHEN 'darmed' THEN 'inst_03_darmed'
        WHEN 'institutoDelta' THEN 'inst_04_instituto_delta'
        ELSE 'inst_' || lower(hex(randomblob(12)))
    END,
    "name", "active", "template", "hasCover", "dniRequired", "showDni", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Institution";

DROP TABLE "Institution";
ALTER TABLE "new_Institution" RENAME TO "Institution";
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

PRAGMA foreign_keys=ON;
