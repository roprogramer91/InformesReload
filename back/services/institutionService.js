const PrismaInstitutionRepository = require('../repositories/prismaInstitutionRepository');

const FIELDS = ['name', 'active', 'template', 'hasCover', 'dniRequired', 'showDni'];
const BOOLEAN_FIELDS = ['active', 'hasCover', 'dniRequired', 'showDni'];

class InstitutionService {
  constructor(repository) {
    this.repository = repository;
  }

  list() {
    return this.repository.list();
  }

  getByName(name) {
    if (!name || typeof name !== 'string') return null;
    return this.repository.findByName(name);
  }

  getById(id) {
    if (!id || typeof id !== 'string') return null;
    return this.repository.findById(id);
  }

  async create(input) {
    const data = this.validate(input, { creating: true });
    const existing = await this.repository.findByName(data.name);
    if (existing) throw this.error(`La institución ${data.name} ya existe`, 409);
    return this.repository.create(data);
  }

  async update(id, input) {
    if (!id || typeof id !== 'string') {
      throw this.error('El ID de la institución es obligatorio', 400);
    }
    const existing = await this.repository.findById(id);
    if (!existing) throw this.error(`Institución no encontrada: ${id}`, 404);

    const data = this.validate(input, { creating: false });
    if (data.name && data.name !== existing.name) {
      const institutionWithSameName = await this.repository.findByName(data.name);
      if (institutionWithSameName) {
        throw this.error(`La institución ${data.name} ya existe`, 409);
      }
    }
    return this.repository.update(id, data);
  }

  validate(input, { creating }) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw this.error('Los datos de la institución son inválidos', 400);
    }

    const unknownFields = Object.keys(input).filter(field => !FIELDS.includes(field));
    if (unknownFields.length) {
      throw this.error(`Campos no permitidos: ${unknownFields.join(', ')}`, 400);
    }

    const data = {};
    if (creating) {
      if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
        throw this.error('El nombre de la institución es obligatorio', 400);
      }
      if (!input.template || typeof input.template !== 'string' || !input.template.trim()) {
        throw this.error('La plantilla de la institución es obligatoria', 400);
      }
      data.name = input.name.trim();
      data.template = input.template.trim();
    } else {
      if (Object.prototype.hasOwnProperty.call(input, 'name')) {
        if (typeof input.name !== 'string' || !input.name.trim()) {
          throw this.error('El nombre de la institución no puede estar vacío', 400);
        }
        data.name = input.name.trim();
      }
      if (Object.prototype.hasOwnProperty.call(input, 'template')) {
        if (typeof input.template !== 'string' || !input.template.trim()) {
          throw this.error('La plantilla no puede estar vacía', 400);
        }
        data.template = input.template.trim();
      }
    }

    for (const field of BOOLEAN_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        if (typeof input[field] !== 'boolean') {
          throw this.error(`${field} debe ser booleano`, 400);
        }
        data[field] = input[field];
      } else if (creating) {
        data[field] = field === 'active';
      }
    }

    if (!creating && Object.keys(data).length === 0) {
      throw this.error('No se recibieron campos editables', 400);
    }

    return data;
  }

  disconnect() {
    return this.repository.disconnect();
  }

  error(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

const institutionService = new InstitutionService(new PrismaInstitutionRepository());

module.exports = institutionService;
module.exports.InstitutionService = InstitutionService;
