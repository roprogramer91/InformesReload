const institutionService = require('../services/institutionService');

const INITIAL_INSTITUTIONS = [
  {
    name: 'consultoriosMedicos',
    active: true,
    template: 'PlantillaA.docx',
    hasCover: true,
    dniRequired: false,
    showDni: false,
  },
  {
    name: 'vitalNorte',
    active: true,
    template: 'PlantillaB.docx',
    hasCover: false,
    dniRequired: true,
    showDni: false,
  },
  {
    name: 'darmed',
    active: true,
    template: 'PlantillaC.docx',
    hasCover: true,
    dniRequired: false,
    showDni: false,
  },
  {
    name: 'institutoDelta',
    active: true,
    template: 'PlantillaD.docx',
    hasCover: true,
    dniRequired: false,
    showDni: false,
  },
];

async function seed() {
  for (const institution of INITIAL_INSTITUTIONS) {
    const existing = await institutionService.getByName(institution.name);
    if (existing) {
      const { name, ...editableFields } = institution;
      await institutionService.update(name, editableFields);
    } else {
      await institutionService.create(institution);
    }
  }
}

seed()
  .then(() => {
    console.log('Instituciones iniciales cargadas correctamente.');
  })
  .catch(error => {
    console.error('No se pudieron cargar las instituciones iniciales:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await institutionService.disconnect();
  });
