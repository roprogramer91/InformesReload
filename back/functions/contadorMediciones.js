/**
 * Contador automático de mediciones diurnas y nocturnas
 * 
 * Este módulo analiza el texto extraído del PDF ABPM y cuenta automáticamente
 * las mediciones clasificándolas por horario en diurnas y nocturnas.
 */

/**
 * Cuenta las mediciones diurnas y nocturnas a partir del texto del PDF
 * 
 * Regla clínica de clasificación por hora:
 * - Día (diurna): 07:00 a 21:59 (7 AM a 9:59 PM)
 * - Noche (nocturna): 22:00 a 06:59 (10 PM a 6:59 AM)
 * 
 * @param {string} textoPDF - Texto completo extraído del PDF ABPM
 * @returns {Object} - Objeto con conteos { medicionesDiurnas, medicionesNocturnas, totalMediciones }
 */
function contarMedicionesDiaNoche(textoPDF) {
  try {
    // Regex para capturar filas de medición con formato:
    // numero + fecha (YYYY/MM/DD o YYYY/M/D) + hora (HH:MM)
    // Ejemplo: "42 2025/12/4 18:45 125 98 86 ↑ 39 65 0"
    const regexMedicion = /^\s*\d+\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}):(\d{2})\s+\d+/gm;
    
    let diurnas = 0;
    let nocturnas = 0;
    let total = 0;
    
    // Buscar todas las coincidencias en el texto
    let match;
    while ((match = regexMedicion.exec(textoPDF)) !== null) {
      // Extraer la hora (HH) de la captura
      const hora = parseInt(match[2], 10);
      const minuto = parseInt(match[3], 10);
      
      // Validar que la hora esté en rango válido (0-23)
      if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) {
        console.warn(`Hora inválida detectada: ${hora}:${minuto}`);
        continue;
      }
      
      total++;
      
      // Clasificar según horario clínico
      // Nocturna: 22:00 a 06:59 (de 10 PM a 6:59 AM)
      // Diurna: 07:00 a 21:59 (de 7 AM a 9:59 PM)
      if (hora >= 22 || hora < 7) {
        nocturnas++;
      } else {
        diurnas++;
      }
    }
    
    // Log para debugging
    console.log('📊 Conteo de mediciones automático:');
    console.log(`   Total: ${total}`);
    console.log(`   Diurnas (07:00-21:59): ${diurnas}`);
    console.log(`   Nocturnas (22:00-06:59): ${nocturnas}`);
    
    return {
      medicionesDiurnas: diurnas,
      medicionesNocturnas: nocturnas,
      totalMediciones: total
    };
    
  } catch (error) {
    console.error('Error al contar mediciones:', error);
    // En caso de error, retornar valores por defecto
    return {
      medicionesDiurnas: 0,
      medicionesNocturnas: 0,
      totalMediciones: 0
    };
  }
}

module.exports = {
  contarMedicionesDiaNoche
};
