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
    // Regex para capturar filas de medición con formato del PDF real
    const regexMedicion = /^\s*\d+\+*\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}):(\d{2})\s+/gm;
    
    // Extraer todas las mediciones
    const mediciones = [];
    let match;
    while ((match = regexMedicion.exec(textoPDF)) !== null) {
      const hora = parseInt(match[2], 10);
      const minuto = parseInt(match[3], 10);
      
      if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59) {
        mediciones.push({ hora, minuto });
      }
    }
    
    const total = mediciones.length;
    
    if (total === 0) {
      console.log('⚠️  No se encontraron mediciones en el PDF');
      return { medicionesDiurnas: 0, medicionesNocturnas: 0, totalMediciones: 0 };
    }
    
    // Usar clasificación 08:00-22:00 como mejor compromiso
    // Esta clasificación da buenos resultados promedio para diferentes equipos ABPM
    let diurnas = 0;
    let nocturnas = 0;
    
    mediciones.forEach(m => {
      // Clasificación estándar ABPM más común:
      // Diurnas: 07:00-21:59 (7 AM a 9:59 PM)
      // Nocturnas: 22:00-06:59 (10 PM a 6:59 AM)
      if (m.hora >= 7 && m.hora <= 21) {
        diurnas++;
      } else {
        nocturnas++;
      }
    });
    
    const porcentajeDiurnas = (diurnas / total) * 100;
    const porcentajeNocturnas = (nocturnas / total) * 100;
    
    console.log('📊 Conteo de mediciones automático:');
    console.log(`   Clasificación: 07:00-21:59 diurnas | 22:00-06:59 nocturnas`);
    console.log(`   Total: ${total}`);
    console.log(`   Diurnas: ${diurnas} (${porcentajeDiurnas.toFixed(1)}%)`);
    console.log(`   Nocturnas: ${nocturnas} (${porcentajeNocturnas.toFixed(1)}%)`);
    
    return {
      medicionesDiurnas: diurnas,
      medicionesNocturnas: nocturnas,
      totalMediciones: total
    };
    
  } catch (error) {
    console.error('Error al contar mediciones:', error);
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
