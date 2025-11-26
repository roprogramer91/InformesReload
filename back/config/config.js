/**
 * Configuración de instituciones médicas
 * 
 * Este módulo gestiona la configuración de cada institución,
 * incluyendo plantillas Word y logos asociados.
 */

// =====================================================
// PARÁMETROS CONFIGURABLES
// =====================================================

/**
 * HORAS MÍNIMAS para considerar un estudio MAPA como válido
 * Si el estudio tiene menos horas, se usa la plantilla "FaltaInfo"
 * 
 * IMPORTANTE: Este valor puede cambiar según criterio médico
 * Modificar solo este número para ajustar el umbral
 */
const HORAS_MINIMAS_ESTUDIO = 17;

// =====================================================
// CONFIGURACIÓN DE INSTITUCIONES
// =====================================================

const INSTITUCIONES = {
  consultoriosMedicos: {
    id: 'consultoriosMedicos',
    nombre: 'Consultorios Médicos',
    nombreCompleto: 'Consultorios Médicos - Centro de Diagnóstico',
    plantilla: 'PlantillaA.docx',
    plantillaFaltaInfo: 'plantillaFaltaInfo-cm.docx',
    logo: 'consultorios_medicos.png',
    descripcion: 'Centro de diagnóstico médico especializado'
  },
  
  vitalNorte: {
    id: 'vitalNorte',
    nombre: 'Vital Norte',
    nombreCompleto: 'Vital Norte - Instituto de Salud',
    plantilla: 'PlantillaB.docx',
    plantillaFaltaInfo: 'plantillaFaltaInfo-VN.docx',
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

/**
 * Obtiene el umbral mínimo de horas para un estudio válido
 * 
 * @returns {number} - Horas mínimas requeridas
 */
function obtenerHorasMinimasEstudio() {
  return HORAS_MINIMAS_ESTUDIO;
}

/**
 * Verifica si un estudio tiene suficientes horas
 * 
 * @param {number} horas - Duración del estudio en horas
 * @returns {boolean} - true si cumple el mínimo, false si no
 */
function esEstudioValido(horas) {
  return horas >= HORAS_MINIMAS_ESTUDIO;
}

module.exports = {
  INSTITUCIONES,
  HORAS_MINIMAS_ESTUDIO,
  obtenerConfiguracionInstitucion,
  esInstitucionValida,
  obtenerTodasLasInstituciones,
  obtenerHorasMinimasEstudio,
  esEstudioValido
};
