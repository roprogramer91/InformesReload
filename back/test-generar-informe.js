/**
 * Script de prueba para generar un informe Word completo
 * 
 * Este script:
 * 1. Lee un PDF
 * 2. Extrae los datos del paciente
 * 3. Genera el informe Word
 */

const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor');
const { construirPaciente } = require('./functions/crearPaciente');
const { generarYGuardarInforme } = require('./functions/crearInforme');

async function probarGeneracionInforme(rutaPDF, institucionId) {
  try {
    console.log('\n🧪 PRUEBA DE GENERACIÓN DE INFORME COMPLETO');
    console.log('='.repeat(80));
    console.log('📄 PDF:', rutaPDF);
    console.log('🏥 Institución:', institucionId);
    
    // 1. Leer el PDF
    console.log('\n📝 Paso 1: Extrayendo texto del PDF...');
    const pdfBuffer = fs.readFileSync(rutaPDF);
    const textoPDF = await leerTextoDelPDF(pdfBuffer);
    console.log('✅ Texto extraído:', textoPDF.length, 'caracteres');
    
    // 2. Construir objeto paciente
    console.log('\n👤 Paso 2: Construyendo objeto Paciente...');
    let paciente = construirPaciente(textoPDF);
    console.log('✅ Paciente creado:', paciente.nombre);
    
    // 3. Agregar mediciones manualmente (en la app real el usuario las ingresa)
    console.log('\n💉 Paso 3: Agregando mediciones...');
    paciente.medicionesDiurnas = 59;  // Ejemplo: 59 mediciones diurnas
    paciente.medicionesNocturnas = 18; // Ejemplo: 18 mediciones nocturnas
    console.log('✅ Mediciones agregadas: Diurnas:', paciente.medicionesDiurnas, '| Nocturnas:', paciente.medicionesNocturnas);
    
    // 4. Generar el informe
    console.log('\n📄 Paso 4: Generando informe Word...');
    const rutaInforme = await generarYGuardarInforme(paciente, institucionId);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('📁 Informe generado en:', rutaInforme);
    console.log('='.repeat(80));
    console.log('\n💡 Ahora podés abrir el archivo Word y verificar que todos los datos se rellenaron correctamente.\n');
    
    return rutaInforme;
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Configuración de la prueba
const rutaPDF = process.argv[2] || './test-pdfs/BARRIOS ANTONIA-P.pdf';
const institucionId = process.argv[3] || 'consultoriosMedicos'; // o 'vitalNorte'

// Ejecutar prueba
probarGeneracionInforme(rutaPDF, institucionId);
