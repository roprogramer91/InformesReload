// Script de diagnóstico para ver el formato exacto del PDF
const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor.js');
const { contarMedicionesDiaNoche } = require('./functions/contadorMediciones.js');

async function diagnosticarPDF(nombreArchivo) {
  try {
    console.log('=== DIAGNÓSTICO DE PDF ===\n');
    
    const pdfPath = `./test-pdfs/${nombreArchivo}`;
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ No se encontró el archivo:', pdfPath);
      console.log('\n📁 Archivos disponibles en test-pdfs:');
      const files = fs.readdirSync('./test-pdfs');
      files.forEach(f => console.log(`  - ${f}`));
      return;
    }
    
    console.log(`📄 Procesando: ${pdfPath}\n`);
    
    // Leer el PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    const textoPDF = await leerTextoDelPDF(pdfBuffer);
    
    // Guardar el texto extraído para inspección
    fs.writeFileSync('./texto-extraido.txt', textoPDF, 'utf8');
    console.log('✅ Texto extraído guardado en: texto-extraido.txt\n');
    
    // Buscar líneas que parezcan mediciones
    console.log('🔍 Buscando patrones de medición en el texto...\n');
    
    const lineas = textoPDF.split('\n');
    let lineasConNumeros = [];
    
    lineas.forEach((linea, index) => {
      // Buscar líneas que tengan números, fecha/hora
      if (/\d{1,2}:\d{2}/.test(linea) && /\d{1,3}/.test(linea)) {
        lineasConNumeros.push({ numero: index + 1, texto: linea.trim() });
      }
    });
    
    console.log(`📊 Encontradas ${lineasConNumeros.length} líneas que parecen mediciones:\n`);
    
    // Mostrar las primeras 10 líneas
    lineasConNumeros.slice(0, 10).forEach(l => {
      console.log(`Línea ${l.numero}: "${l.texto}"`);
    });
    
    if (lineasConNumeros.length > 10) {
      console.log(`\n... y ${lineasConNumeros.length - 10} más`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Intentando contar con el regex actual...\n');
    
    // Intentar contar
    const resultado = contarMedicionesDiaNoche(textoPDF);
    
    console.log('\n' + '='.repeat(60));
    console.log('REGEX ACTUAL:');
    console.log('/^\\s*\\d+\\s+(\\d{4}\\/\\d{1,2}\\/\\d{1,2})\\s+(\\d{1,2}):(\\d{2})\\s+\\d+/gm');
    console.log('\nEste regex busca líneas con formato:');
    console.log('numero + fecha (YYYY/MM/DD) + hora (HH:MM) + valores');
    console.log('Ejemplo: "42 2025/12/4 18:45 125 98 86"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Usar el nombre del archivo como argumento o pedir al usuario
const nombreArchivo = process.argv[2] || 'BARRIOS ANTONIA-P.pdf';
diagnosticarPDF(nombreArchivo);
