/**
 * Generador de informes médicos en formato Word
 * 
 * Este módulo toma el objeto paciente y genera un documento Word
 * a partir de la plantilla correspondiente a la institución.
 */

const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { validarEstudioCompleto } = require('../config/config');
const institutionService = require('../services/institutionService');

const PLANTILLAS_INSUFICIENTES = {
  'PlantillaA.docx': 'PlantillaFaltaInfo-CM.docx',
  'PlantillaB.docx': 'PlantillaFaltaInfo-VN.docx',
};

/**
 * Genera un informe médico en formato Word
 * 
 * @param {Object} paciente - Objeto con los datos del paciente
 * @param {string} institucionId - ID de la institución (consultoriosMedicos, vitalNorte)
 * @returns {Buffer} - Buffer del documento Word generado
 */
async function generarInforme(paciente, institucionId) {
  try {
    // Obtener configuración de la institución
    const institucion = await institutionService.getByName(institucionId);
    
    if (!institucion) {
      throw new Error(`Institución no válida: ${institucionId}`);
    }
    
    console.log(`📄 Generando informe para institución: ${institucion.name}`);
    
    // Validar estudio completo (horas + mediciones)
    const duracionHoras = paciente.duracionHoras || 0;
    const medicionesDiurnas = paciente.medicionesDiurnas || 0;
    const medicionesNocturnas = paciente.medicionesNocturnas || 0;
    
    const validacion = validarEstudioCompleto(
      duracionHoras,
      medicionesDiurnas,
      medicionesNocturnas
    );
    
    // Determinar qué plantilla usar
    let plantillaAUsar;
    if (validacion.valido) {
      // Estudio válido: usar plantilla normal
      plantillaAUsar = institucion.template;
      console.log(`✅ Estudio VÁLIDO`);
      console.log(`   - Duración: ${duracionHoras} hrs`);
      console.log(`   - Mediciones diurnas: ${medicionesDiurnas}`);
      console.log(`   - Mediciones nocturnas: ${medicionesNocturnas}`);
      console.log(`   - Plantilla: ${plantillaAUsar}`);
    } else {
      // Estudio insuficiente: usar plantilla "FaltaInfo"
      plantillaAUsar = PLANTILLAS_INSUFICIENTES[institucion.template] || institucion.template;
      console.log(`⚠️  Estudio INSUFICIENTE - Motivos:`);
      validacion.motivos.forEach(motivo => console.log(`   - ${motivo}`));
      console.log(`   - Plantilla: ${plantillaAUsar}`);
    }
    
    // Cargar la plantilla
    const plantillaPath = path.join(__dirname, '../templates', plantillaAUsar);
    
    if (!fs.existsSync(plantillaPath)) {
      throw new Error(`No se encontró la plantilla: ${plantillaPath}`);
    }
    
    const content = fs.readFileSync(plantillaPath, 'binary');
    const zip = new PizZip(content);
    
    // Crear instancia de Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Mapear datos del paciente a las variables de la plantilla
    const datos = {
      // Datos básicos
      NOMBRE: paciente.nombre || '',
      DNI: paciente.dni || '',
      EDAD: paciente.edad || '',
      FECHA: paciente.fechaFormateada || '',
      HORAS: paciente.duracionHoras || '',
      
      // Mediciones
      MEDICIONES_DIURNAS: paciente.medicionesDiurnas || '',
      MEDICIONES_NOCTURNAS: paciente.medicionesNocturnas || '',
      
      // Presiones arteriales
      PRESION_PROMEDIO: paciente.todasLasMediasPA ? `${paciente.todasLasMediasPA}mmHg` : '',
      PRESION_DIURNA: paciente.mediasPADia ? `${paciente.mediasPADia}mmHg` : '',
      PRESION_NOCTURNA: paciente.mediasPANoche ? `${paciente.mediasPANoche}mmHg` : '',
      
      // Cargas de presión arterial (porcentajes)
      PRESION_DIURNA_SISTOLICA: paciente.valorCargaPADia?.SYS || '',
      PRESION_DIURNA_DIASTOLICA: paciente.valorCargaPADia?.DIA || '',
      PRESION_NOCTURNA_SISTOLICA: paciente.valorCargaPANoche?.SYS || '',
      PRESION_NOCTURNA_DIASTOLICA: paciente.valorCargaPANoche?.DIA || '',
      
      // Presión de pulso
      PRESION_PULSO_D: paciente.presionPulsoD || '',
      PRESION_PULSO_C: paciente.presionPulsoC || '',
      
      // Patrón Dipper
      PATRON_DIPPER_D: paciente.dipperD || '',
      PATRON_DIPPER_C: paciente.dipperC || '',
      
      // Clasificación de presión arterial
      PRESION_ARTERIAL: paciente.clasificacionPA || '',
    };

    
    console.log('✅ Datos mapeados a plantilla');
    
    // Rellenar la plantilla con los datos
    doc.render(datos);
    
    console.log('✅ Plantilla rellenada');
    
    // Generar el buffer del documento
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    console.log('✅ Documento generado exitosamente');
    
    return buffer;
    
  } catch (error) {
    console.error('❌ Error al generar informe:', error);
    
    // Mostrar más detalles si es un error de Docxtemplater
    if (error.properties && error.properties.errors) {
      console.error('Errores de plantilla:');
      error.properties.errors.forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
    
    throw new Error(`Error al generar informe: ${error.message}`);
  }
}

/**
 * Genera un informe y lo guarda en un archivo
 * 
 * @param {Object} paciente - Objeto con los datos del paciente
 * @param {string} institucionId - ID de la institución
 * @param {string} rutaSalida - Ruta donde guardar el archivo (opcional)
 * @returns {string} - Ruta del archivo generado
 */
async function generarYGuardarInforme(paciente, institucionId, rutaSalida) {
  try {
    // Generar el informe
    const buffer = await generarInforme(paciente, institucionId);
    
    // Determinar la ruta de salida
    if (!rutaSalida) {
      const nombreArchivo = `${paciente.nombre.replace(/\s+/g, '_')}.docx`;
      rutaSalida = path.join(__dirname, '../output', nombreArchivo);
    }
    
    // Asegurar que existe el directorio de salida
    const dirSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(dirSalida)) {
      fs.mkdirSync(dirSalida, { recursive: true });
    }
    
    // Guardar el archivo
    fs.writeFileSync(rutaSalida, buffer);
    
    console.log(`💾 Informe guardado en: ${rutaSalida}`);
    
    return rutaSalida;
    
  } catch (error) {
    console.error('❌ Error al guardar informe:', error);
    throw error;
  }
}

module.exports = {
  generarInforme,
  generarYGuardarInforme
};

/**
 * Genera un informe y lo guarda en un archivo
 * 
 * @param {Object} paciente - Objeto con los datos del paciente
 * @param {string} institucionId - ID de la institución
 * @param {string} rutaSalida - Ruta donde guardar el archivo (opcional)
 * @returns {string} - Ruta del archivo generado
 */
async function generarYGuardarInforme(paciente, institucionId, rutaSalida) {
  try {
    // Generar el informe
    const buffer = await generarInforme(paciente, institucionId);
    
    // Determinar la ruta de salida
    if (!rutaSalida) {
      const nombreArchivo = `${paciente.nombre.replace(/\s+/g, '_')}.docx`;
      rutaSalida = path.join(__dirname, '../output', nombreArchivo);
    }
    
    // Asegurar que existe el directorio de salida
    const dirSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(dirSalida)) {
      fs.mkdirSync(dirSalida, { recursive: true });
    }
    
    // Guardar el archivo
    fs.writeFileSync(rutaSalida, buffer);
    
    console.log(`💾 Informe guardado en: ${rutaSalida}`);
    
    return rutaSalida;
    
  } catch (error) {
    console.error('❌ Error al guardar informe:', error);
    throw error;
  }
}

module.exports = {
  generarInforme,
  generarYGuardarInforme
};
