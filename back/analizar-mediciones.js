// Script para analizar exactamente qué mediciones se están contando
const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor.js');

async function analizarMediciones(nombreArchivo) {
  try {
    console.log('=== ANÁLISIS DETALLADO DE MEDICIONES ===\n');
    
    const pdfPath = `./test-pdfs/${nombreArchivo}`;
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ No se encontró el archivo');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const textoPDF = await leerTextoDelPDF(pdfBuffer);
    
    // Usar el mismo regex que en contadorMediciones.js
    const regexMedicion = /^\s*\d+\+*\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}):(\d{2})\s+/gm;
    
    let diurnas = [];
    let nocturnas = [];
    
    let match;
    while ((match = regexMedicion.exec(textoPDF)) !== null) {
      const fecha = match[1];
      const hora = parseInt(match[2], 10);
      const minuto = parseInt(match[3], 10);
      
      const medicion = {
        fecha,
        hora: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
        horaNum: hora
      };
      
      // Clasificar según horario
      if (hora >= 22 || hora < 7) {
        nocturnas.push(medicion);
      } else {
        diurnas.push(medicion);
      }
    }
    
    console.log(`📊 TOTAL: ${diurnas.length + nocturnas.length} mediciones\n`);
    console.log(`🌞 DIURNAS (07:00-21:59): ${diurnas.length} mediciones`);
    console.log(`🌙 NOCTURNAS (22:00-06:59): ${nocturnas.length} mediciones\n`);
    
    // Mostrar las primeras y últimas mediciones de cada tipo
    console.log('🌞 PRIMERAS 3 DIURNAS:');
    diurnas.slice(0, 3).forEach(m => console.log(`   ${m.fecha} ${m.hora}`));
    
    console.log('\n🌞 ÚLTIMAS 3 DIURNAS:');
    diurnas.slice(-3).forEach(m => console.log(`   ${m.fecha} ${m.hora}`));
    
    console.log('\n🌙 PRIMERAS 3 NOCTURNAS:');
    nocturnas.slice(0, 3).forEach(m => console.log(`   ${m.fecha} ${m.hora}`));
    
    console.log('\n🌙 ÚLTIMAS 3 NOCTURNAS:');
    nocturnas.slice(-3).forEach(m => console.log(`   ${m.fecha} ${m.hora}`));
    
    // Buscar mediciones en horarios límite
    console.log('\n🔍 MEDICIONES EN HORARIOS LÍMITE:');
    
    const limite1 = diurnas.filter(m => m.horaNum === 7); // 07:00-07:59
    const limite2 = diurnas.filter(m => m.horaNum === 21); // 21:00-21:59
    const limite3 = nocturnas.filter(m => m.horaNum === 22); // 22:00-22:59
    const limite4 = nocturnas.filter(m => m.horaNum === 6); // 06:00-06:59
    
    if (limite1.length > 0) {
      console.log(`\n   Hora 07:00-07:59 (DIURNAS): ${limite1.length}`);
      limite1.forEach(m => console.log(`      ${m.fecha} ${m.hora}`));
    }
    
    if (limite2.length > 0) {
      console.log(`\n   Hora 21:00-21:59 (DIURNAS): ${limite2.length}`);
      limite2.forEach(m => console.log(`      ${m.fecha} ${m.hora}`));
    }
    
    if (limite3.length > 0) {
      console.log(`\n   Hora 22:00-22:59 (NOCTURNAS): ${limite3.length}`);
      limite3.forEach(m => console.log(`      ${m.fecha} ${m.hora}`));
    }
    
    if (limite4.length > 0) {
      console.log(`\n   Hora 06:00-06:59 (NOCTURNAS): ${limite4.length}`);
      limite4.forEach(m => console.log(`      ${m.fecha} ${m.hora}`));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('VALORES ESPERADOS SEGÚN ABPM:');
    console.log('   Diurnas: 58');
    console.log('   Nocturnas: 17');
    console.log('\nVALORES DETECTADOS:');
    console.log(`   Diurnas: ${diurnas.length} (${diurnas.length - 58 > 0 ? '+' : ''}${diurnas.length - 58})`);
    console.log(`   Nocturnas: ${nocturnas.length} (${nocturnas.length - 17 > 0 ? '+' : ''}${nocturnas.length - 17})`);
    
    console.log('\n💡 POSIBLES CAUSAS DE LA DIFERENCIA:');
    console.log('   1. Medición en horario límite clasificada diferente');
    console.log('   2. ABPM excluye alguna medición marcada como error (++ o +)');
    console.log('   3. Diferencia en definición de horarios (ej: 22:00 exacto)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const nombreArchivo = process.argv[2] || 'BARRIOS ANTONIA-P.pdf';
analizarMediciones(nombreArchivo);
