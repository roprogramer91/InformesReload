class InstitutionRepository {
  async list() {
    throw new Error('InstitutionRepository.list() no implementado');
  }

  async findByName(_name) {
    throw new Error('InstitutionRepository.findByName() no implementado');
  }

  async findById(_id) {
    throw new Error('InstitutionRepository.findById() no implementado');
  }

  async create(_data) {
    throw new Error('InstitutionRepository.create() no implementado');
  }

  async update(_id, _data) {
    throw new Error('InstitutionRepository.update() no implementado');
  }

  async disconnect() {}
}

module.exports = InstitutionRepository;
