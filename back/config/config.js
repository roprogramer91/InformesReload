/**
 * Configuración de instituciones médicas
 * 
 * Este módulo gestiona la configuración de cada institución,
 * incluyendo plantillas Word y logos asociados.
 */

// =====================================================
// PARÁMETROS CONFIGURABLES - VALIDACIÓN DE ESTUDIOS
// =====================================================

/**
 * CRITERIOS DE VALIDACIÓN para estudios MAPA
 * Según guías internacionales de compliance técnico
 * 
 * IMPORTANTE: Estos valores pueden cambiar según criterio médico
 * Modificar solo estos números para ajustar los umbrales
 */

// Duración mínima del estudio
const HORAS_MINIMAS_ESTUDIO = 17;

// Mediciones mínimas requeridas
const MEDICIONES_DIURNAS_MINIMAS = 20;
const MEDICIONES_NOCTURNAS_MINIMAS = 7;

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
 * Obtiene los umbrales mínimos de mediciones
 * 
 * @returns {Object} - Objeto con mediciones mínimas {diurnas, nocturnas}
 */
function obtenerMedicionesMinimasEstudio() {
  return {
    diurnas: MEDICIONES_DIURNAS_MINIMAS,
    nocturnas: MEDICIONES_NOCTURNAS_MINIMAS
  };
}

/**
 * Verifica si un estudio cumple con TODOS los criterios de validación
 * Según guías internacionales:
 * - Duración mínima
 * - Cantidad mínima de mediciones diurnas
 * - Cantidad mínima de mediciones nocturnas
 * 
 * @param {number} horas - Duración del estudio en horas
 * @param {number} medicionesDiurnas - Cantidad de mediciones diurnas
 * @param {number} medicionesNocturnas - Cantidad de mediciones nocturnas
 * @returns {Object} - {valido: boolean, motivos: string[]}
 */
function validarEstudioCompleto(horas, medicionesDiurnas, medicionesNocturnas) {
  const motivos = [];
  
  // Validar duración
  if (horas < HORAS_MINIMAS_ESTUDIO) {
    motivos.push(`Duración insuficiente: ${horas} hrs (mínimo ${HORAS_MINIMAS_ESTUDIO} hrs)`);
  }
  
  // Validar mediciones diurnas
  if (medicionesDiurnas < MEDICIONES_DIURNAS_MINIMAS) {
    motivos.push(`Mediciones diurnas insuficientes: ${medicionesDiurnas} (mínimo ${MEDICIONES_DIURNAS_MINIMAS})`);
  }
  
  // Validar mediciones nocturnas
  if (medicionesNocturnas < MEDICIONES_NOCTURNAS_MINIMAS) {
    motivos.push(`Mediciones nocturnas insuficientes: ${medicionesNocturnas} (mínimo ${MEDICIONES_NOCTURNAS_MINIMAS})`);
  }
  
  return {
    valido: motivos.length === 0,
    motivos: motivos
  };
}

/**
 * Verifica si un estudio tiene suficientes horas (validación simple)
 * DEPRECADO: Usar validarEstudioCompleto() para validación completa
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
  MEDICIONES_DIURNAS_MINIMAS,
  MEDICIONES_NOCTURNAS_MINIMAS,
  obtenerConfiguracionInstitucion,
  esInstitucionValida,
  obtenerTodasLasInstituciones,
  obtenerHorasMinimasEstudio,
  obtenerMedicionesMinimasEstudio,
  validarEstudioCompleto,
  esEstudioValido // Mantener por compatibilidad
};
