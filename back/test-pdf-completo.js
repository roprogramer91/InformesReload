// Test con PDF real
const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor.js');
const { contarMedicionesDiaNoche } = require('./functions/contadorMediciones.js');
const { construirPaciente } = require('./functions/crearPaciente.js');

async function testPDFReal() {
  try {
    console.log('=== Test con PDF Real ===\n');
    
    // Usar uno de los PDFs de prueba existentes
    const pdfPath = './test-pdfs/BARRIOS ANTONIA-P.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ No se encontró el archivo PDF de prueba');
      console.log('Archivos disponibles:');
      const files = fs.readdirSync('./test-pdfs');
      files.forEach(f => console.log(`  - ${f}`));
      return;
    }
    
    console.log(`📄 Leyendo PDF: ${pdfPath}\n`);
    
    // Leer el PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const textoPDF = await leerTextoDelPDF(pdfBuffer);
    
    console.log('📊 Contando mediciones...\n');
    
    // Contar mediciones directamente
    const mediciones = contarMedicionesDiaNoche(textoPDF);
    
    console.log('\n=== Construcción Completa del Paciente ===\n');
    
    // Construir paciente completo (esto debería incluir las mediciones automáticamente)
    const paciente = construirPaciente(textoPDF);
    
    console.log('\n=== Verificación Final ===');
    console.log(`Paciente: ${paciente.nombre}`);
    console.log(`Edad: ${paciente.edad}`);
    console.log(`Mediciones Diurnas: ${paciente.medicionesDiurnas}`);
    console.log(`Mediciones Nocturnas: ${paciente.medicionesNocturnas}`);
    console.log(`Total Mediciones: ${paciente.totalMediciones}`);
    
    if (paciente.medicionesDiurnas > 0 && paciente.medicionesNocturnas > 0) {
      console.log('\n✅ El paciente tiene mediciones calculadas automáticamente!');
    } else {
      console.log('\n⚠️ No se detectaron mediciones');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error(error.stack);
  }
}

testPDFReal();
