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

  create(data) {
    return this.prisma.institution.create({ data });
  }

  update(name, data) {
    return this.prisma.institution.update({ where: { name }, data });
  }

  initializeSchemaForTests() {
    return this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Institution" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "template" TEXT NOT NULL,
        "hasCover" BOOLEAN NOT NULL DEFAULT false,
        "dniRequired" BOOLEAN NOT NULL DEFAULT false,
        "showDni" BOOLEAN NOT NULL DEFAULT false
      )
    `);
  }

  disconnect() {
    return this.prisma.$disconnect();
  }
}

module.exports = PrismaInstitutionRepository;
