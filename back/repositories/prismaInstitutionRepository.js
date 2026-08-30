const { PrismaClient } = require('@prisma/client');
const InstitutionRepository = require('./institutionRepository');

class PrismaInstitutionRepository extends InstitutionRepository {
  constructor(options = {}) {
    super();
    this.prisma = options.prisma || new PrismaClient(
      options.databaseUrl
        ? { datasources: { db: { url: options.databaseUrl } } }
        : undefined
    );
  }

  list() {
    return this.prisma.institution.findMany({ orderBy: { name: 'asc' } });
  }

  findByName(name) {
    return this.prisma.institution.findUnique({ where: { name } });
  }

  findById(id) {
    return this.prisma.institution.findUnique({ where: { id } });
  }

  create(data) {
    return this.prisma.institution.create({ data });
  }

  update(id, data) {
    return this.prisma.institution.update({ where: { id }, data });
  }

  initializeSchemaForTests() {
    return this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Institution" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "template" TEXT NOT NULL,
        "hasCover" BOOLEAN NOT NULL DEFAULT false,
        "dniRequired" BOOLEAN NOT NULL DEFAULT false,
        "showDni" BOOLEAN NOT NULL DEFAULT false,
        "dniMode" TEXT NOT NULL DEFAULT 'OPTIONAL',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Institution_name_key" ON "Institution"("name")
    `);
  }

  disconnect() {
    return this.prisma.$disconnect();
  }
}

module.exports = PrismaInstitutionRepository;
