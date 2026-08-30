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

  if (institution.dniMode === 'MANUAL') {
    return exigirDniManual(manual);
  }

  if (institution.dniMode === 'OPTIONAL') {
    return awp || exigirDniManual(manual);
  }

  return awp;
}

function exigirDniManual(dni) {
  if (dni) return dni;
  const error = new Error('Se requiere ingresar manualmente el DNI antes de generar el informe');
  error.statusCode = 400;
  error.code = 'DNI_MANUAL_REQUIRED';
  throw error;
}

module.exports = { normalizarDni, resolverDniPaciente };
