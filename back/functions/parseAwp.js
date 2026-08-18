const { calcularPatronDipper, calcularPresionPulso, clasificarPresionArterial, evaluarRiesgoCardiovascular } = require('./calculations');

function parseAwpBuffer(buffer) {
  const text = buffer.toString('latin1');
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

function formatearFechaDesdeDate(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return '';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

function crearTimestampMedicion(raw) {
  if (!raw || raw.length < 12) return null;

  const year = parseInt(raw.slice(0, 4), 16);
  const month = parseInt(raw.slice(4, 6), 16);
  const day = parseInt(raw.slice(6, 8), 16);
  const hour = parseInt(raw.slice(8, 10), 16);
  const minute = parseInt(raw.slice(10, 12), 16);
  const timestamp = new Date(year, month - 1, day, hour, minute);

  const coincide = timestamp.getFullYear() === year
    && timestamp.getMonth() === month - 1
    && timestamp.getDate() === day
    && timestamp.getHours() === hour
    && timestamp.getMinutes() === minute;

  return coincide ? timestamp : null;
}

function construirPacienteDesdeAwpBuffer(buffer, opciones = {}) {
  const data = parseAwpBuffer(buffer);
  const pd = data['PATIENTDATA'] || {};
  const ab = data['ABPMDATA'] || {};

  const nombre = pd['Name'] || '';
  const edad = parseInt(pd['Age']) || 0;

  const yearAdministrativo = parseInt(pd['YearBegin']);
  const monthAdministrativo = parseInt(pd['MonBegin']);
  const dayAdministrativo = parseInt(pd['DayBegin']);
  const fechaAdministrativaDate = new Date(yearAdministrativo, monthAdministrativo - 1, dayAdministrativo);
  const fechaAdministrativa = fechaAdministrativaDate.getFullYear() === yearAdministrativo
    && fechaAdministrativaDate.getMonth() === monthAdministrativo - 1
    && fechaAdministrativaDate.getDate() === dayAdministrativo
    ? formatearFechaDesdeDate(fechaAdministrativaDate)
    : '';

  const wakeH = parseInt(pd['AwakeHour']), wakeM = parseInt(pd['AwakeMin']);
  const sleepH = parseInt(pd['AsleepHour']), sleepM = parseInt(pd['AsleepMin']);
  const wakeMin = wakeH * 60 + wakeM;
  const sleepMin = sleepH * 60 + sleepM;

  const total = parseInt(pd['ABPMCount']);
  const validas = [];
  let primeraMedicionTimestamp = null;
  let primeraTimestamp = null, ultimaTimestamp = null;

  for (let i = 1; i <= total; i++) {
    const raw = ab[String(i)];
    if (!raw) continue;

    const ts = crearTimestampMedicion(raw);
    if (!ts) continue;
    if (!primeraMedicionTimestamp || ts < primeraMedicionTimestamp) primeraMedicionTimestamp = ts;

    const comment = ab['C' + i] !== undefined ? ab['C' + i] : '';
    if (comment !== '') continue;

    const hour = parseInt(raw.slice(8, 10), 16);
    const min  = parseInt(raw.slice(10, 12), 16);
    const sys  = parseInt(raw.slice(16, 18), 16);
    const dia  = parseInt(raw.slice(20, 22), 16);

    if (sys === 0 && dia === 0) continue;

    if (!primeraTimestamp || ts < primeraTimestamp) primeraTimestamp = ts;
    if (!ultimaTimestamp  || ts > ultimaTimestamp)  ultimaTimestamp  = ts;

    const t = hour * 60 + min;
    const esDespierto = t >= wakeMin && t <= sleepMin;
    validas.push({ hour, min, sys, dia, esDespierto });
  }

  let duracionHoras = 24;
  if (primeraTimestamp && ultimaTimestamp) {
    const diffMs = ultimaTimestamp - primeraTimestamp;
    duracionHoras = Math.min(24, Math.round(diffMs / (1000 * 60 * 60)));
  }

  const fechaPrimeraMedicion = formatearFechaDesdeDate(primeraMedicionTimestamp);
  const fechaFormateada = opciones.fechaCorregida || fechaPrimeraMedicion || fechaAdministrativa;

  const despierto = validas.filter(m => m.esDespierto);
  const dormido   = validas.filter(m => !m.esDespierto);

  const avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;

  const sysDia   = avg(despierto.map(m => m.sys));
  const diaDia   = avg(despierto.map(m => m.dia));
  const sysNoche = avg(dormido.map(m => m.sys));
  const diaNoche = avg(dormido.map(m => m.dia));
  const sysTotal = avg(validas.map(m => m.sys));
  const diaTotal = avg(validas.map(m => m.dia));

  const pct = (arr, threshold) => arr.length
    ? ((arr.filter(x => x > threshold).length / arr.length) * 100).toFixed(1) + '%'
    : '0.0%';

  const cargaDiaSYS   = pct(despierto.map(m => m.sys), 135);
  const cargaDiaDIA   = pct(despierto.map(m => m.dia), 85);
  const cargaNocheSYS = pct(dormido.map(m => m.sys), 120);
  const cargaNocheDIA = pct(dormido.map(m => m.dia), 70);

  const descensoSYS = sysDia > 0 ? parseFloat(((sysDia - sysNoche) / sysDia * 100).toFixed(1)) : 0;
  const descensoDIA = diaDia > 0 ? parseFloat(((diaDia - diaNoche) / diaDia * 100).toFixed(1)) : 0;

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
    fechaPrimeraMedicion,
    fechaAdministrativa,
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
    medicionesDiurnas:   despierto.length,
    medicionesNocturnas: dormido.length,
    totalMediciones:     validas.length
  };
}

module.exports = { construirPacienteDesdeAwpBuffer };
