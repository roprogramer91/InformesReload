const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const PizZip = require('pizzip');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgresql://informesreload:informesreload_local@localhost:5432/informes_reload_test?schema=public';

if (!new URL(TEST_DATABASE_URL).pathname.endsWith('/informes_reload_test')) {
  throw new Error('TEST_DATABASE_URL debe apuntar exclusivamente a la base informes_reload_test');
}

process.env.DATABASE_URL = TEST_DATABASE_URL;

const { startServer } = require('../index');
const institutionService = require('../services/institutionService');
const { generarInforme } = require('../functions/crearInforme');
const { construirPacienteDesdeAwpBuffer } = require('../functions/parseAwp');
const { resolverDniPaciente } = require('../services/dniService');
const { institucionTieneCaratula, generarCaratulaDocx } = require('../functions/generarCaratula');

let server;
let baseUrl;

const initialInstitutions = [
  ['consultoriosMedicos', 'PlantillaA.docx', true, false, 'OPTIONAL'],
  ['vitalNorte', 'PlantillaB.docx', false, true, 'AWP'],
  ['darmed', 'PlantillaC.docx', true, false, 'MANUAL'],
  ['institutoDelta', 'PlantillaD.docx', true, false, 'MANUAL'],
];

before(async () => {
  resetTestDatabase();

  for (const [name, template, hasCover, dniRequired, dniMode] of initialInstitutions) {
    await institutionService.create({
      name,
      active: true,
      template,
      hasCover,
      dniRequired,
      showDni: false,
      dniMode,
    });
  }

  server = startServer(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await institutionService.disconnect();
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
  assert.deepEqual(
    Object.fromEntries(body.data.map(institution => [institution.name, institution.dniMode])),
    {
      consultoriosMedicos: 'OPTIONAL',
      darmed: 'MANUAL',
      institutoDelta: 'MANUAL',
      vitalNorte: 'AWP',
    }
  );
});

test('extrae ID Paciente desde PATIENTDATA', () => {
  const awp = Buffer.from([
    '[PATIENTDATA]',
    'Name=PACIENTE SINTETICO',
    'ID=30111222',
    'Age=50',
    'ABPMCount=0',
    '[ABPMDATA]',
  ].join('\r\n'), 'latin1');

  const paciente = construirPacienteDesdeAwpBuffer(awp);

  assert.equal(paciente.dni, '30111222');
});

test('resuelve el DNI según la configuración institucional', async () => {
  assert.equal(await resolverDniPaciente('vitalNorte', '30111222', '99999999'), '30111222');
  assert.equal(await resolverDniPaciente('darmed', '30111222', '28999888'), '28999888');
  assert.equal(await resolverDniPaciente('consultoriosMedicos', '30111222', ''), '30111222');
  assert.equal(await resolverDniPaciente('consultoriosMedicos', '', '27666777'), '27666777');
  await assert.rejects(
    resolverDniPaciente('institutoDelta', '30111222', ''),
    error => error.code === 'DNI_MANUAL_REQUIRED' && error.statusCode === 400
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
      dniMode: 'MANUAL',
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.name, 'institucionPrueba');
  assert.equal(body.data.dniMode, 'MANUAL');
  assert.equal(typeof body.data.id, 'string');
  assert.ok(body.data.id.length > 0);
  assert.ok(body.data.createdAt);
  assert.ok(body.data.updatedAt);
});

test('edita el nombre de una institución conservando su ID estable', async () => {
  const created = await institutionService.getByName('institucionPrueba');
  const response = await fetch(`${baseUrl}/api/instituciones/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'institucionRenombrada', active: false, hasCover: true }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.active, false);
  assert.equal(body.data.hasCover, true);
  assert.equal(body.data.id, created.id);
  assert.equal(body.data.name, 'institucionRenombrada');
});

test('rechaza nombres duplicados al editar', async () => {
  const renamed = await institutionService.getByName('institucionRenombrada');
  const response = await fetch(`${baseUrl}/api/instituciones/${renamed.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'darmed' }),
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.success, false);
});

test('mantiene generación y carátulas para las cuatro instituciones', async () => {
  const paciente = {
    nombre: 'PACIENTE SINTETICO',
    dni: '30111222',
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
    let functionalName = name;
    let renamedInstitution;
    if (name === 'darmed') {
      const institution = await institutionService.getByName(name);
      renamedInstitution = await institutionService.update(institution.id, { name: 'darmedRenombrada' });
      functionalName = renamedInstitution.name;
    }

    const report = await generarInforme(paciente, functionalName);
    assert.ok(Buffer.isBuffer(report));
    assert.ok(report.length > 0);
    const documentXml = new PizZip(report).file('word/document.xml').asText();
    assert.match(documentXml, /30111222/);
    assert.equal(await institucionTieneCaratula(functionalName), hasCover);

    if (hasCover) {
      const cover = await generarCaratulaDocx(paciente.nombre, functionalName);
      assert.ok(Buffer.isBuffer(cover));
      assert.ok(cover.length > 0);
    }

    if (renamedInstitution) {
      await institutionService.update(renamedInstitution.id, { name });
    }
  }
});

function resetTestDatabase() {
  const prismaCli = require.resolve('prisma/build/index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'reset', '--force', '--skip-seed'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
