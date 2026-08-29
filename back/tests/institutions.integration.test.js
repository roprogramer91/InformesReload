const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BACK_DIR = path.resolve(__dirname, '..');
const TEST_DB_PATH = path.join(BACK_DIR, 'prisma', 'institutions-test.db');
process.env.DATABASE_URL = 'file:./institutions-test.db';

const { startServer } = require('../index');
const institutionService = require('../services/institutionService');
const { generarInforme } = require('../functions/crearInforme');
const { institucionTieneCaratula, generarCaratulaDocx } = require('../functions/generarCaratula');

let server;
let baseUrl;

const initialInstitutions = [
  ['consultoriosMedicos', 'PlantillaA.docx', true, false],
  ['vitalNorte', 'PlantillaB.docx', false, true],
  ['darmed', 'PlantillaC.docx', true, false],
  ['institutoDelta', 'PlantillaD.docx', true, false],
];

before(async () => {
  removeTestDatabase();
  await institutionService.repository.initializeSchemaForTests();

  for (const [name, template, hasCover, dniRequired] of initialInstitutions) {
    await institutionService.create({
      name,
      active: true,
      template,
      hasCover,
      dniRequired,
      showDni: false,
    });
  }

  server = startServer(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await institutionService.disconnect();
  removeTestDatabase();
});

test('lista las cuatro instituciones iniciales', async () => {
  const response = await fetch(`${baseUrl}/api/instituciones`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(
    body.data.map(institution => institution.name).sort(),
    initialInstitutions.map(([name]) => name).sort()
  );
});

test('crea una institución con el modelo mínimo', async () => {
  const response = await fetch(`${baseUrl}/api/instituciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'institucionPrueba',
      active: true,
      template: 'PlantillaPrueba.docx',
      hasCover: false,
      dniRequired: false,
      showDni: false,
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.name, 'institucionPrueba');
});

test('edita una institución sin permitir cambiar su clave name', async () => {
  const response = await fetch(`${baseUrl}/api/instituciones/institucionPrueba`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false, hasCover: true }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.active, false);
  assert.equal(body.data.hasCover, true);
  assert.equal(body.data.name, 'institucionPrueba');
});

test('mantiene generación y carátulas para las cuatro instituciones', async () => {
  const paciente = {
    nombre: 'PACIENTE SINTETICO',
    edad: 50,
    fechaFormateada: '29/08/2026',
    duracionHoras: 24,
    medicionesDiurnas: 30,
    medicionesNocturnas: 10,
    todasLasMediasPA: '120/80',
    mediasPADia: '122/81',
    mediasPANoche: '110/70',
    valorCargaPADia: { SYS: '10%', DIA: '5%' },
    valorCargaPANoche: { SYS: '8%', DIA: '4%' },
    presionPulsoD: 'Presión de pulso sintética.',
    presionPulsoC: 'Presión de pulso normal.',
    dipperD: 'Patrón sintético.',
    dipperC: 'Patrón Dipper.',
    clasificacionPA: 'Normal',
  };

  for (const [name, _template, hasCover] of initialInstitutions) {
    const report = await generarInforme(paciente, name);
    assert.ok(Buffer.isBuffer(report));
    assert.ok(report.length > 0);
    assert.equal(await institucionTieneCaratula(name), hasCover);

    if (hasCover) {
      const cover = await generarCaratulaDocx(paciente.nombre, name);
      assert.ok(Buffer.isBuffer(cover));
      assert.ok(cover.length > 0);
    }
  }
});

function removeTestDatabase() {
  for (const suffix of ['', '-journal', '-shm', '-wal']) {
    const filePath = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
