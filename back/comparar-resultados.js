// Test específico para comparar método inteligente
const fs = require('fs');
const { leerTextoDelPDF } = require('./functions/pdfExtractor.js');
const { contarMedicionesDiaNoche } = require('./functions/contadorMediciones.js');

async function compararResultados() {
  console.log('========== COMPARACIÓN DE RESULTADOS ==========\n');
  
  const pdfs = [
    { 
      nombre: 'BARRIOS ANTONIA-P.pdf',
      esperado: { diurnas: 58, nocturnas: 17 }
    },
    { 
      nombre: 'PASCERI JULIO-P.pdf',
      esperado: { diurnas: 59, nocturnas: 17 }
    }
  ];
  
  for (const pdf of pdfs) {
    console.log(`\n📄 ${pdf.nombre}`);
    console.log('─'.repeat(50));
    
    try {
      const pdfBuffer = fs.readFileSync(`./test-pdfs/${pdf.nombre}`);
      const textoPDF = await leerTextoDelPDF(pdfBuffer);
      const resultado = contarMedicionesDiaNoche(textoPDF);
      
      const errorDiurnas = resultado.medicionesDiurnas - pdf.esperado.diurnas;
      const errorNocturnas = resultado.medicionesNocturnas - pdf.esperado.nocturnas;
      
      console.log(`\n✅ Método Inteligente (Auto-detectado):`);
      console.log(`   Clasificación: ${resultado.clasificacionUsada}`);
      console.log(`   Diurnas: ${resultado.medicionesDiurnas} (esperado: ${pdf.esperado.diurnas}) ${errorDiurnas > 0 ? '+' : ''}${errorDiurnas}`);
      console.log(`   Nocturnas: ${resultado.medicionesNocturnas} (esperado: ${pdf.esperado.nocturnas}) ${errorNocturnas > 0 ? '+' : ''}${errorNocturnas}`);
      
      const errorTotal = Math.abs(errorDiurnas) + Math.abs(errorNocturnas);
      console.log(`   Error total: ${errorTotal} mediciones`);
      
      if (errorTotal <= 2) {
        console.log(`   ✅ EXCELENTE - Error ≤ 2 mediciones`);
      } else if (errorTotal <= 4) {
        console.log(`   ⚠️  ACEPTABLE - Error 3-4 mediciones`);
      } else {
        console.log(`   ❌ PROBLEMÁTICO - Error > 4 mediciones`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

compararResultados();
