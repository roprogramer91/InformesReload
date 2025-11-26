/**
 * Configuración de instituciones médicas
 * 
 * Este módulo gestiona la configuración de cada institución,
 * incluyendo plantillas Word y logos asociados.
 */

const INSTITUCIONES = {
  consultoriosMedicos: {
    id: 'consultoriosMedicos',
    nombre: 'Consultorios Médicos',
    nombreCompleto: 'Consultorios Médicos - Centro de Diagnóstico',
    plantilla: 'PlantillaA.docx',
    logo: 'consultorios_medicos.png',
    descripcion: 'Centro de diagnóstico médico especializado'
  },
  
  vitalNorte: {
    id: 'vitalNorte',
    nombre: 'Vital Norte',
    nombreCompleto: 'Vital Norte - Instituto de Salud',
    plantilla: 'PlantillaB.docx',
    logo: 'vital_norte.png',
    descripcion: 'Instituto de salud integral'
  }
};

/**
 * Obtiene la configuración de una institución por su ID
 * 
 * @param {string} institucionId - ID de la institución
 * @returns {Object|null} - Configuración de la institución o null si no existe
 */
function obtenerConfiguracionInstitucion(institucionId) {
  return INSTITUCIONES[institucionId] || null;
}

/**
 * Verifica si un ID de institución es válido
 * 
 * @param {string} institucionId - ID de la institución a verificar
 * @returns {boolean} - true si es válido, false si no
 */
function esInstitucionValida(institucionId) {
  return INSTITUCIONES.hasOwnProperty(institucionId);
}

/**
 * Obtiene todas las instituciones disponibles
 * 
 * @returns {Array} - Array con todas las configuraciones de instituciones
 */
function obtenerTodasLasInstituciones() {
  return Object.values(INSTITUCIONES);
}

module.exports = {
  INSTITUCIONES,
  obtenerConfiguracionInstitucion,
  esInstitucionValida,
  obtenerTodasLasInstituciones
};
