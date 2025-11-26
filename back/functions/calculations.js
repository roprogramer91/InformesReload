/**
 * Cálculos médicos para análisis de presión arterial
 * 
 * Este módulo contiene todas las funciones de cálculo necesarias para
 * el análisis de los datos de MAPA (Monitoreo Ambulatorio de Presión Arterial)
 */

/**
 * Calcula el patrón Dipper basado en el descenso nocturno de la presión arterial
 * 
 * Clasificación (según práctica médica estándar):
 * - Dipper: Descenso del 10-20% (patrón normal)
 * - Non-Dipper: Descenso < 10% o pequeño incremento hasta -5% (sin descenso significativo)
 * - Extreme Dipper: Descenso > 20% (descenso exagerado)
 * - Riser: Incremento nocturno > 5% (inversión del ritmo circadiano)
 * 
 * @param {number} descensoSYS - Porcentaje de descenso sistólico nocturno
 * @param {number} descensoDIA - Porcentaje de descenso diastólico nocturno
 * @returns {Object} - Descripción y conclusión del patrón Dipper
 */
function calcularPatronDipper(descensoSYS, descensoDIA) {
  let patron = '';
  let descripcion = '';
  let conclusion = '';
  
  // Determinar el patrón basado en el descenso sistólico (más importante)
  const descenso = descensoSYS;
  
  if (descenso >= 10 && descenso <= 20) {
    patron = 'Dipper';
    descripcion = `Ritmo circadiano con disminución adecuada de la presión arterial sistólica durante la noche. Patrón ${patron}.`;
    conclusion = `Patrón ${patron}.`;
  } else if (descenso < 10 && descenso >= -5) {
    // Incluye desde pequeños incrementos hasta < 10% de descenso
    patron = 'Non-Dipper';
    descripcion = `Ritmo circadiano sin disminución significativa de la presión arterial sistólica durante la noche. Patrón ${patron}.`;
    conclusion = `Patrón ${patron}.`;
  } else if (descenso > 20) {
    patron = 'Extreme Dipper';
    descripcion = `Ritmo circadiano con disminución exagerada de la presión arterial sistólica durante la noche. Patrón ${patron}.`;
    conclusion = `Patrón ${patron}.`;
  } else {
    // Incremento nocturno significativo (< -5%)
    patron = 'Riser';
    descripcion = `Ritmo circadiano invertido con incremento de la presión arterial sistólica durante la noche. Patrón ${patron}.`;
    conclusion = `Patrón ${patron}.`;
  }
  
  return {
    patron,
    descripcion,
    conclusion
  };
}

/**
 * Calcula la presión de pulso y la clasifica según la edad del paciente
 * 
 * Presión de Pulso = Presión Sistólica - Presión Diastólica
 * 
 * Clasificación:
 * - Normal: 30-50 mmHg (puede variar con la edad)
 * - Baja: < 30 mmHg
 * - Elevada: > 50 mmHg
 * 
 * @param {number} sistolica - Presión arterial sistólica promedio
 * @param {number} diastolica - Presión arterial diastólica promedio
 * @param {number} edad - Edad del paciente
 * @returns {Object} - Descripción y conclusión de la presión de pulso
 */
function calcularPresionPulso(sistolica, diastolica, edad) {
  const presionPulso = sistolica - diastolica;
  let clasificacion = '';
  let descripcion = '';
  let conclusion = '';
  
  // Clasificar según el valor
  if (presionPulso < 30) {
    clasificacion = 'Baja';
    descripcion = `Promedio de la presión de pulso ${presionPulso} mmHg.`;
    conclusion = `Presión de pulso ${clasificacion} (${presionPulso} mmHg).`;
  } else if (presionPulso >= 30 && presionPulso <= 50) {
    clasificacion = 'Normal';
    descripcion = `Promedio de la presión de pulso ${presionPulso} mmHg.`;
    conclusion = `Presión de pulso ${clasificacion} (${presionPulso} mmHg).`;
  } else {
    clasificacion = 'Elevada';
    descripcion = `Promedio de la presión de pulso ${presionPulso} mmHg.`;
    
    // Conclusión concisa
    if (edad >= 60) {
      conclusion = `Presión de pulso ${clasificacion} (${presionPulso} mmHg). Incremento del riesgo cardiovascular.`;
    } else {
      conclusion = `Presión de pulso ${clasificacion} (${presionPulso} mmHg). Incremento del riesgo cardiovascular.`;
    }
  }
  
  return {
    valor: presionPulso,
    clasificacion,
    descripcion,
    conclusion
  };
}

/**
 * Clasifica la presión arterial según las guías AHA 2025
 * 
 * Clasificación según valores promedio:
 * - Normal: < 120/80 mmHg
 * - Elevada: 120-129/<80 mmHg
 * - Hipertensión Nivel 1: 130-139/80-89 mmHg
 * - Hipertensión Nivel 2: ≥140/≥90 mmHg
 * - HTA Sistólica Aislada: SYS ≥ 140 y DIA < 90 mmHg
 * 
 * @param {number} sistolica - Presión arterial sistólica promedio
 * @param {number} diastolica - Presión arterial diastólica promedio
 * @returns {string} - Clasificación de la presión arterial
 */
function clasificarPresionArterial(sistolica, diastolica) {
  // HTA Sistólica Aislada (sistólica elevada pero diastólica normal)
  if (sistolica >= 140 && diastolica < 90) {
    return 'Hipertensión Sistólica Aislada';
  }
  
  // Clasificación combinada (se toma el nivel más alto)
  // Nivel 2: ≥140 mmHg O ≥90 mmHg
  if (sistolica >= 140 || diastolica >= 90) {
    return 'Hipertensión Nivel 2';
  } 
  // Nivel 1: 130-139 mmHg O 80-89 mmHg
  else if (sistolica >= 130 || diastolica >= 80) {
    return 'Hipertensión Nivel 1';
  } 
  // Elevada: 120-129 mmHg y <80 mmHg
  else if (sistolica >= 120 && diastolica < 80) {
    return 'Presión Arterial Elevada';
  } 
  // Normal: <120/<80
  else {
    return 'Normal';
  }
}

/**
 * Evalúa el riesgo cardiovascular basado en múltiples factores
 * 
 * @param {Object} datos - Objeto con los datos del paciente
 * @returns {string} - Evaluación del riesgo cardiovascular
 */
function evaluarRiesgoCardiovascular(datos) {
  const riesgos = [];
  
  // Patrón Non-Dipper o Riser es factor de riesgo
  if (datos.patron === 'Non-Dipper' || datos.patron === 'Riser') {
    riesgos.push('Patrón circadiano alterado');
  }
  
  // Presión de pulso elevada es factor de riesgo
  if (datos.presionPulso > 50) {
    riesgos.push('Presión de pulso elevada');
  }
  
  // Hipertensión es factor de riesgo
  if (datos.clasificacionPA.includes('Hipertensión')) {
    riesgos.push(datos.clasificacionPA);
  }
  
  if (riesgos.length === 0) {
    return 'Riesgo cardiovascular bajo. Parámetros dentro de rangos normales.';
  } else if (riesgos.length === 1) {
    return `Riesgo cardiovascular moderado. Factor identificado: ${riesgos[0]}.`;
  } else {
    return `Riesgo cardiovascular aumentado. Factores identificados: ${riesgos.join(', ')}.`;
  }
}

/**
 * Formatea una fecha de "YYYY/MM/DD HH:MM" a "DD/MM/YYYY"
 * 
 * @param {string} fechaOriginal - Fecha en formato YYYY/MM/DD HH:MM
 * @returns {string} - Fecha formateada DD/MM/YYYY
 */
function formatearFecha(fechaOriginal) {
  try {
    if (!fechaOriginal) return '';
    
    // Extraer solo la parte de la fecha
    const partes = fechaOriginal.split(' ')[0].split('/');
    if (partes.length !== 3) return fechaOriginal;
    
    const [año, mes, dia] = partes;
    return `${dia}/${mes}/${año}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return fechaOriginal;
  }
}

/**
 * Ajusta las horas de duración (redondea según minutos)
 * Formato entrada: "24H37M"
 * 
 * @param {string} duracion - Duración en formato XH YM
 * @returns {number} - Horas ajustadas (redondeadas)
 */
function ajustarHoraDuracion(duracion) {
  try {
    const match = duracion.match(/(\d+)H(\d+)M/);
    if (!match) return 0;
    
    const horas = parseInt(match[1]);
    const minutos = parseInt(match[2]);
    
    // Redondear: >= 30 minutos suma 1 hora
    return minutos >= 30 ? horas + 1 : horas;
  } catch (error) {
    console.error('Error al ajustar duración:', error);
    return 0;
  }
}

module.exports = {
  calcularPatronDipper,
  calcularPresionPulso,
  clasificarPresionArterial,
  evaluarRiesgoCardiovascular,
  formatearFecha,
  ajustarHoraDuracion
};
