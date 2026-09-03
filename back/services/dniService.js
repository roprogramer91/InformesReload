const institutionService = require('./institutionService');

function normalizarDni(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

async function resolverDniPaciente(institucionNombre, dniAwp, dniManual) {
  const institution = await institutionService.getByName(institucionNombre);
  if (!institution) {
    const error = new Error(`Institución no encontrada: ${institucionNombre}`);
    error.statusCode = 404;
    throw error;
  }

  const awp = normalizarDni(dniAwp);
  const manual = normalizarDni(dniManual);
  let dni = '';

  if (institution.dniMode === 'MANUAL') {
    dni = manual;
  } else if (institution.dniMode === 'OPTIONAL') {
    dni = awp || manual;
  } else {
    dni = awp;
  }

  if (!dni && institution.dniRequired) {
    const error = new Error('El DNI es obligatorio para esta institución');
    error.statusCode = 400;
    error.code = 'DNI_REQUIRED';
    throw error;
  }

  return dni;
}

module.exports = { normalizarDni, resolverDniPaciente };
