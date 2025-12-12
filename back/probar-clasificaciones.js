// Test con diferentes clasificaciones de horarios
const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor.js');

async function probarClasificaciones(nombreArchivo) {
  try {
    console.log('=== PROBANDO DIFERENTES CLASIFICACIONES ===\n');
    
    const pdfPath = `./test-pdfs/${nombreArchivo}`;
    const pdfBuffer = fs.readFileSync(pdfPath);
    const textoPDF = await leerTextoDelPDF(pdfBuffer);
    
    const regexMedicion = /^\s*\d+\+*\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}):(\d{2})\s+/gm;
    
    // Contar mediciones totales
    const mediciones = [];
    let match;
    while ((match = regexMedicion.exec(textoPDF)) !== null) {
      mediciones.push({
        hora: parseInt(match[2], 10),
        minuto: parseInt(match[3], 10)
      });
    }
    
    console.log(`📊 Total de mediciones: ${mediciones.length}\n`);
    console.log('🎯 Valores esperados según ABPM: 58 diurnas, 17 nocturnas\n');
    console.log('='.repeat(70));
    
    // Opción 1: 07:00-21:59 diurnas (ACTUAL)
    let d1 = mediciones.filter(m => m.hora >= 7 && m.hora <= 21).length;
    let n1 = mediciones.filter(m => m.hora >= 22 || m.hora < 7).length;
    console.log('\nOpción 1: DIURNAS 07:00-21:59 | NOCTURNAS 22:00-06:59 (ACTUAL)');
    console.log(`   Diurnas: ${d1} | Nocturnas: ${n1} ${d1 === 58 && n1 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    // Opción 2: 08:00-21:59 diurnas
    let d2 = mediciones.filter(m => m.hora >= 8 && m.hora <= 21).length;
    let n2 = mediciones.filter(m => m.hora >= 22 || m.hora < 8).length;
    console.log('\nOpción 2: DIURNAS 08:00-21:59 | NOCTURNAS 22:00-07:59');
    console.log(`   Diurnas: ${d2} | Nocturnas: ${n2} ${d2 === 58 && n2 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    // Opción 3: 06:00-21:59 diurnas
    let d3 = mediciones.filter(m => m.hora >= 6 && m.hora <= 21).length;
    let n3 = mediciones.filter(m => m.hora >= 22 || m.hora < 6).length;
    console.log('\nOpción 3: DIURNAS 06:00-21:59 | NOCTURNAS 22:00-05:59');
    console.log(`   Diurnas: ${d3} | Nocturnas: ${n3} ${d3 === 58 && n3 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    // Opción 4: 07:00-22:00 diurnas (incluye 22:00)
    let d4 = mediciones.filter(m => m.hora >= 7 && m.hora <= 22).length;
    let n4 = mediciones.filter(m => m.hora >= 23 || m.hora < 7).length;
    console.log('\nOpción 4: DIURNAS 07:00-22:59 | NOCTURNAS 23:00-06:59');
    console.log(`   Diurnas: ${d4} | Nocturnas: ${n4} ${d4 === 58 && n4 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    // Opción 5: 08:00-22:00 diurnas (incluye 22:00)
    let d5 = mediciones.filter(m => m.hora >= 8 && m.hora <= 22).length;
    let n5 = mediciones.filter(m => m.hora >= 23 || m.hora < 8).length;
    console.log('\nOpción 5: DIURNAS 08:00-22:59 | NOCTURNAS 23:00-07:59');
    console.log(`   Diurnas: ${d5} | Nocturnas: ${n5} ${d5 === 58 && n5 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    // Opción 6: 06:00-22:00 diurnas (incluye 22:00)
    let d6 = mediciones.filter(m => m.hora >= 6 && m.hora <= 22).length;
    let n6 = mediciones.filter(m => m.hora >= 23 || m.hora < 6).length;
    console.log('\nOpción 6: DIURNAS 06:00-22:59 | NOCTURNAS 23:00-05:59');
    console.log(`   Diurnas: ${d6} | Nocturnas: ${n6} ${d6 === 58 && n6 === 17 ? '✅ COINCIDE' : '❌'}`);
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const nombreArchivo = process.argv[2] || 'BARRIOS ANTONIA-P.pdf';
probarClasificaciones(nombreArchivo);
