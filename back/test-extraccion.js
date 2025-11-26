/**
 * Script de prueba para verificar la extracción de datos del PDF
 */

const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor');
const { construirPaciente } = require('./functions/crearPaciente');

async function probarExtraccion(rutaPDF) {
  try {
    console.log('\n🧪 INICIANDO PRUEBA DE EXTRACCIÓN DE DATOS');
    console.log('='.repeat(80));
    console.log('📄 PDF:', rutaPDF);
    
    // Leer el archivo
    const pdfBuffer = fs.readFileSync(rutaPDF);
    
    // Extraer texto
    console.log('\n📝 Extrayendo texto del PDF...');
    const texto = await leerTextoDelPDF(pdfBuffer);
    console.log('✅ Texto extraído:', texto.length, 'caracteres');
    
    // Construir objeto paciente
    console.log('\n👤 Construyendo objeto Paciente...');
    const paciente = construirPaciente(texto);
    
    // Mostrar resultados
    console.log('\n📊 DATOS EXTRAÍDOS:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(paciente, null, 2));
    console.log('='.repeat(80));
    
    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE\n');
    
    return paciente;
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar prueba
const rutaPDF = process.argv[2] || './test-pdfs/BARRIOS ANTONIA-P.pdf';
probarExtraccion(rutaPDF);
