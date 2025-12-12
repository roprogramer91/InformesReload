/**
 * Construcción del objeto Paciente a partir del texto extraído del PDF ABPM
 * 
 * Este módulo procesa el texto del PDF y extrae la información relevante
 * del paciente para construir un objeto estructurado con todos los datos necesarios.
 */

/**
 * Extrae el nombre completo del paciente
 * Formato esperado: dos líneas consecutivas con APELLIDO y NOMBRE
 */
function extraerNombre(texto) {
  try {
    const lineas = texto.split('\n');
    let apellido = '';
    let nombre = '';
    
    // Buscar las líneas que contienen el apellido y nombre
    // En el PDF aparecen como dos líneas seguidas después de "Informe de Monitoreo"
    for (let i = 0; i < lineas.length; i++) {
      if (lineas[i].includes('Informe de Monitoreo')) {
        // El apellido está 1-2 líneas después
        if (lineas[i + 1] && lineas[i + 1].trim().length > 0 && !lineas[i + 1].includes('ID paciente')) {
          apellido = lineas[i + 1].trim();
        }
        if (lineas[i + 2] && lineas[i + 2].trim().length > 0 && !lineas[i + 2].includes('ID paciente')) {
          nombre = lineas[i + 2].trim();
        }
        break;
      }
    }
    
    return `${apellido} ${nombre}`.trim();
  } catch (error) {
    console.error('Error al extraer nombre:', error);
    return '';
  }
}

/**
 * Extrae la edad del paciente
 * Formato: "Edad: \t53"
 */
function extraerEdad(texto) {
  try {
    const match = texto.match(/Edad:\s*\t?(\d+)/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    console.error('Error al extraer edad:', error);
    return null;
  }
}

/**
 * Extrae las fechas y duración del estudio
 * Formato: "Inicio prueba: \t2025/11/15 09:34 \tDuración: \t24H37M"
 */
function extraerFechas(texto) {
  try {
    const lineas = texto.split('\n');
    
    // Fecha de inicio
    const matchInicio = texto.match(/Inicio prueba:\s*\t?(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/);
    const fechaInicio = matchInicio ? matchInicio[1] : '';
    
    // Duración
    const matchDuracion = texto.match(/Duración:\s*\t?(\d+H\d+M)/);
    const duracion = matchDuracion ? matchDuracion[1] : '';
    
    // Fecha de fin - buscar la línea después de "Fin prueba:"
    let fechaFin = '';
    for (let i = 0; i < lineas.length; i++) {
      if (lineas[i].includes('Fin prueba:')) {
        // La fecha está en las siguientes líneas
        for (let j = i + 1; j < i + 5; j++) {
          const match = lineas[j]?.match(/(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/);
          if (match) {
            fechaFin = match[1];
            break;
          }
        }
        break;
      }
    }
    
    return {
      fechaInicio,
      fechaFin,
      duracion
    };
  } catch (error) {
    console.error('Error al extraer fechas:', error);
    return { fechaInicio: '', fechaFin: '', duracion: '' };
  }
}

/**
 * Extrae las medias de presión arterial
 * Formato: "Todas las medias PA: \t161/99mmHg"
 */
function extraerMediasPA(texto) {
  try {
    // Todas las medias
    const matchTodas = texto.match(/Todas las medias PA:\s*\t?(\d+)\/(\d+)mmHg/);
    const todasLasMedias = matchTodas ? `${matchTodas[1]}/${matchTodas[2]}` : '';
    
    // Medias día
    const matchDia = texto.match(/Medias PA dia:\s*\t?(\d+)\/(\d+)mmHg/);
    const mediasDia = matchDia ? `${matchDia[1]}/${matchDia[2]}` : '';
    
    // Medias noche
    const matchNoche = texto.match(/Medias PA noche:\s*\t?(\d+)\/(\d+)mmHg/);
    const mediasNoche = matchNoche ? `${matchNoche[1]}/${matchNoche[2]}` : '';
    
    return {
      todas: todasLasMedias,
      dia: mediasDia,
      noche: mediasNoche
    };
  } catch (error) {
    console.error('Error al extraer medias de PA:', error);
    return { todas: '', dia: '', noche: '' };
  }
}

/**
 * Extrae los valores de carga de PA (porcentajes)
 * Formato: "SYS(>135mmHg) 93.2% \tSYS(>120mmHg) 100.0%"
 */
function extraerCargaPA(texto) {
  try {
    // Carga día
    const matchDiaSYS = texto.match(/SYS\(>135mmHg\)\s*(\d+\.?\d*)%/);
    const matchDiaDIA = texto.match(/DIA\(>85mmHg\)\s*(\d+\.?\d*)%/);
    
    // Carga noche
    const matchNocheSYS = texto.match(/SYS\(>120mmHg\)\s*(\d+\.?\d*)%/);
    const matchNocheDIA = texto.match(/DIA\(>70mmHg\)\s*(\d+\.?\d*)%/);
    
    return {
      dia: {
        SYS: matchDiaSYS ? `${matchDiaSYS[1]}%` : '',
        DIA: matchDiaDIA ? `${matchDiaDIA[1]}%` : ''
      },
      noche: {
        SYS: matchNocheSYS ? `${matchNocheSYS[1]}%` : '',
        DIA: matchNocheDIA ? `${matchNocheDIA[1]}%` : ''
      }
    };
  } catch (error) {
    console.error('Error al extraer carga PA:', error);
    return { dia: { SYS: '', DIA: '' }, noche: { SYS: '', DIA: '' } };
  }
}

/**
 * Extrae el ritmo circadiano
 * Formato: "Ritmo circadiano de PA:DES SyS noche. -3.2% \tDes DIA noche 5.7%"
 */
function extraerRitmoCircadiano(texto) {
  try {
    const match = texto.match(/SyS noche\.\s*([-\d.]+)%\s*\t?Des DIA noche\s*([-\d.]+)%/);
    
    if (match) {
      const descensoSYS = parseFloat(match[1]);
      const descensoDIA = parseFloat(match[2]);
      
      return {
        descensoSYS,
        descensoDIA,
        porcentajeSYS: `${match[1]}%`,
        porcentajeDIA: `${match[2]}%`
      };
    }
    
    return {
      descensoSYS: 0,
      descensoDIA: 0,
      porcentajeSYS: '',
      porcentajeDIA: ''
    };
  } catch (error) {
    console.error('Error al extraer ritmo circadiano:', error);
    return {
      descensoSYS: 0,
      descensoDIA: 0,
      porcentajeSYS: '',
      porcentajeDIA: ''
    };
  }
}

/**
 * Construye el objeto Paciente completo a partir del texto del PDF
 * Incluye todos los cálculos médicos necesarios
 * 
 * @param {string} textoPDF - Texto extraído del PDF
 * @returns {Object} - Objeto con todos los datos del paciente y cálculos médicos
 */
function construirPaciente(textoPDF) {
  try {
    const {
      calcularPatronDipper,
      calcularPresionPulso,
      clasificarPresionArterial,
      evaluarRiesgoCardiovascular,
      formatearFecha,
      ajustarHoraDuracion
    } = require('./calculations');
    
    // Importar contador automático de mediciones
    const { contarMedicionesDiaNoche } = require('./contadorMediciones');
    
    // Extraer datos básicos
    const nombre = extraerNombre(textoPDF);
    const edad = extraerEdad(textoPDF);
    const fechas = extraerFechas(textoPDF);
    const mediasPA = extraerMediasPA(textoPDF);
    const cargaPA = extraerCargaPA(textoPDF);
    const ritmoCircadiano = extraerRitmoCircadiano(textoPDF);
    
    // Contar mediciones automáticamente desde el PDF
    const medicionesConteo = contarMedicionesDiaNoche(textoPDF);
    
    // Parsear valores numéricos de presión arterial
    const [sysTotal, diaTotal] = mediasPA.todas.split('/').map(Number);
    const [sysDia, diaDia] = mediasPA.dia.split('/').map(Number);
    const [sysNoche, diaNoche] = mediasPA.noche.split('/').map(Number);
    
    // Calcular patrón Dipper
    const dipperCalc = calcularPatronDipper(
      ritmoCircadiano.descensoSYS,
      ritmoCircadiano.descensoDIA
    );
    
    // Calcular presión de pulso
    const presionPulsoCalc = calcularPresionPulso(sysTotal, diaTotal, edad);
    
    // Clasificar presión arterial
    const clasificacionPA = clasificarPresionArterial(sysTotal, diaTotal);
    
    // Evaluar riesgo cardiovascular
    const riesgoCV = evaluarRiesgoCardiovascular({
      patron: dipperCalc.patron,
      presionPulso: presionPulsoCalc.valor,
      clasificacionPA: clasificacionPA
    });
    
    // Formatear fecha (usar fecha de FIN para el informe)
    const fechaFormateada = formatearFecha(fechas.fechaFin);
    
    // Ajustar horas de duración
    const duracionHoras = ajustarHoraDuracion(fechas.duracion);
    
    const paciente = {
      // Datos personales
      nombre,
      edad,
      
      // Fechas del estudio
      fechaInicio: fechas.fechaInicio,
      fechaFormateada,
      fechaFin: fechas.fechaFin,
      duracion: fechas.duracion,
      duracionHoras,
      
      // Medias de presión arterial
      todasLasMediasPA: mediasPA.todas,
      mediasPADia: mediasPA.dia,
      mediasPANoche: mediasPA.noche,
      
      // Valores de carga
      valorCargaPADia: cargaPA.dia,
      valorCargaPANoche: cargaPA.noche,
      
      // Ritmo circadiano y cálculos
      ritmoCircadiano: {
        descensoSYS: ritmoCircadiano.descensoSYS,
        descensoDIA: ritmoCircadiano.descensoDIA,
        porcentajeSYS: ritmoCircadiano.porcentajeSYS,
        porcentajeDIA: ritmoCircadiano.porcentajeDIA
      },
      
      // Patrón Dipper
      dipperPatron: dipperCalc.patron,
      dipperD: dipperCalc.descripcion,
      dipperC: dipperCalc.conclusion,
      
      // Presión de pulso
      presionPulsoValor: presionPulsoCalc.valor,
      presionPulsoD: presionPulsoCalc.descripcion,
      presionPulsoC: presionPulsoCalc.conclusion,
      
      // Clasificación de PA
      clasificacionPA,
      
      // Riesgo cardiovascular
      riesgoCardiovascular: riesgoCV,
      
      // Mediciones (calculadas automáticamente del PDF)
      medicionesDiurnas: medicionesConteo.medicionesDiurnas,
      medicionesNocturnas: medicionesConteo.medicionesNocturnas,
      totalMediciones: medicionesConteo.totalMediciones
    };
    
    return paciente;
    
  } catch (error) {
    console.error('Error al construir paciente:', error);
    throw new Error(`Error al procesar datos del paciente: ${error.message}`);
  }
}

module.exports = {
  construirPaciente,
  extraerNombre,
  extraerEdad,
  extraerFechas,
  extraerMediasPA,
  extraerCargaPA,
  extraerRitmoCircadiano
};
