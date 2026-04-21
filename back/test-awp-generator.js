/**
 * Script de prueba: genera informe completo desde archivo .awp
 * Uso: node test-awp-generator.js <archivo.awp> <institucionId>
 */

const fs = require('fs');
const path = require('path');
const { calcularPatronDipper, calcularPresionPulso, clasificarPresionArterial, evaluarRiesgoCardiovascular } = require('./functions/calculations');
const { generarInforme } = require('./functions/crearInforme');
const { convertirDocxAPdf } = require('./functions/convertirPDF');

function parseAwp(filePath) {
  const text = fs.readFileSync(filePath, 'latin1');
  const lines = text.split(/\r?\n/);
  const data = {};
  let section = '';
  for (const line of lines) {
    if (line.startsWith('[')) { section = line.slice(1, -1); data[section] = {}; continue; }
    const eq = line.indexOf('=');
    if (eq > 0) data[section][line.slice(0, eq)] = line.slice(eq + 1);
  }
  return data;
}

function construirPacienteDesdeAwp(awpPath) {
  const data = parseAwp(awpPath);
  const pd = data['PATIENTDATA'];
  const ab = data['ABPMDATA'];

  // Datos básicos del paciente
  const nombre = pd['Name'] || '';
  const edad = parseInt(pd['Age']) || 0;

  // Fecha del estudio (inicio)
  const y = pd['YearBegin'], m = String(pd['MonBegin']).padStart(2,'0'), d = String(pd['DayBegin']).padStart(2,'0');
  const fechaFormateada = `${d}/${m}/${y}`;

  // Períodos configurados en el dispositivo
  const wakeH = parseInt(pd['AwakeHour']), wakeM = parseInt(pd['AwakeMin']);
  const sleepH = parseInt(pd['AsleepHour']), sleepM = parseInt(pd['AsleepMin']);
  const wakeMin = wakeH * 60 + wakeM;
  const sleepMin = sleepH * 60 + sleepM;

  // Parsear mediciones
  const total = parseInt(pd['ABPMCount']);
  const validas = [];
  let primeraTimestamp = null, ultimaTimestamp = null;

  for (let i = 1; i <= total; i++) {
    const raw = ab[String(i)];
    const comment = ab['C' + i] !== undefined ? ab['C' + i] : '';
    if (!raw || comment !== '') continue;

    const hour = parseInt(raw.slice(8, 10), 16);
    const min  = parseInt(raw.slice(10, 12), 16);
    const sys  = parseInt(raw.slice(16, 18), 16);
    const dia  = parseInt(raw.slice(20, 22), 16);

    // Fecha de la medición
    const mYear  = parseInt(raw.slice(0, 4), 16);
    const mMonth = parseInt(raw.slice(4, 6), 16);
    const mDay   = parseInt(raw.slice(6, 8), 16);

    if (sys === 0 && dia === 0) continue; // medición vacía

    const ts = new Date(mYear, mMonth - 1, mDay, hour, min);
    if (!primeraTimestamp || ts < primeraTimestamp) primeraTimestamp = ts;
    if (!ultimaTimestamp  || ts > ultimaTimestamp)  ultimaTimestamp  = ts;

    const t = hour * 60 + min;
    const esDespierto = t >= wakeMin && t <= sleepMin;
    validas.push({ hour, min, sys, dia, esDespierto });
  }

  // Duración en horas
  let duracionHoras = 24;
  if (primeraTimestamp && ultimaTimestamp) {
    const diffMs = ultimaTimestamp - primeraTimestamp;
    const diffH = diffMs / (1000 * 60 * 60);
    duracionHoras = Math.min(24, Math.round(diffH));
  }

  // Separar por período
  const despierto = validas.filter(m => m.esDespierto);
  const dormido   = validas.filter(m => !m.esDespierto);

  const avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;

  const sysDia   = avg(despierto.map(m => m.sys));
  const diaDia   = avg(despierto.map(m => m.dia));
  const sysNoche = avg(dormido.map(m => m.sys));
  const diaNoche = avg(dormido.map(m => m.dia));
  const sysTotal = avg(validas.map(m => m.sys));
  const diaTotal = avg(validas.map(m => m.dia));

  // Carga PA (% por encima del umbral)
  const pct = (arr, threshold) => arr.length
    ? ((arr.filter(x => x > threshold).length / arr.length) * 100).toFixed(1) + '%'
    : '0.0%';

  const cargaDiaSYS  = pct(despierto.map(m => m.sys), 135);
  const cargaDiaDIA  = pct(despierto.map(m => m.dia), 85);
  const cargaNocheSYS = pct(dormido.map(m => m.sys), 120);
  const cargaNocheDIA = pct(dormido.map(m => m.dia), 70);

  // Ritmo circadiano
  const descensoSYS = sysDia > 0 ? parseFloat(((sysDia - sysNoche) / sysDia * 100).toFixed(1)) : 0;
  const descensoDIA = diaDia > 0 ? parseFloat(((diaDia - diaNoche) / diaDia * 100).toFixed(1)) : 0;

  // Cálculos médicos
  const dipper        = calcularPatronDipper(descensoSYS, descensoDIA);
  const pulso         = calcularPresionPulso(sysTotal, diaTotal, edad);
  const clasificacion = clasificarPresionArterial(sysTotal, diaTotal);
  const riesgo        = evaluarRiesgoCardiovascular({
    patron: dipper.patron,
    presionPulso: pulso.valor,
    clasificacionPA: clasificacion
  });

  return {
    nombre,
    edad,
    fechaFormateada,
    duracionHoras,
    todasLasMediasPA: `${sysTotal}/${diaTotal}`,
    mediasPADia:      `${sysDia}/${diaDia}`,
    mediasPANoche:    `${sysNoche}/${diaNoche}`,
    valorCargaPADia:   { SYS: cargaDiaSYS,  DIA: cargaDiaDIA },
    valorCargaPANoche: { SYS: cargaNocheSYS, DIA: cargaNocheDIA },
    ritmoCircadiano: { descensoSYS, descensoDIA, porcentajeSYS: `${descensoSYS}%`, porcentajeDIA: `${descensoDIA}%` },
    dipperPatron: dipper.patron,
    dipperD:      dipper.descripcion,
    dipperC:      dipper.conclusion,
    presionPulsoValor: pulso.valor,
    presionPulsoD:     pulso.descripcion,
    presionPulsoC:     pulso.conclusion,
    clasificacionPA:    clasificacion,
    riesgoCardiovascular: riesgo,
    medicionesDiurnas:  despierto.length,
    medicionesNocturnas: dormido.length,
    totalMediciones:    validas.length
  };
}

// === MAIN ===
const awpFile      = process.argv[2] || './test-pdfs/2026042110195401.awp';
const institucionId = process.argv[3] || 'vitalNorte';

console.log('Procesando:', awpFile);
const paciente = construirPacienteDesdeAwp(awpFile);

console.log('\n=== DATOS DEL PACIENTE ===');
console.log(JSON.stringify(paciente, null, 2));

console.log('\n=== GENERANDO INFORME ===');
const docxBuffer = generarInforme(paciente, institucionId);

// Local: guardar como DOCX (LibreOffice no disponible en Windows local)
// En Railway la conversión a PDF funciona correctamente
const outputPath = path.join(__dirname, 'output', `${paciente.nombre}.docx`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, docxBuffer);

console.log('\n✅ DOCX generado (verificar contenido):', outputPath);
