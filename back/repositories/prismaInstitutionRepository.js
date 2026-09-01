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

  disconnect() {
    return this.prisma.$disconnect();
  }
}

module.exports = PrismaInstitutionRepository;
