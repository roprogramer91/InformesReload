/**
 * Script de prueba para leer y analizar PDFs del ABPM
 * 
 * Uso: node test-pdf-reader.js <ruta-al-pdf>
 * Ejemplo: node test-pdf-reader.js "./test-pdfs/ejemplo.pdf"
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function leerPDF(rutaPDF) {
  try {
    console.log('\n📄 Leyendo PDF:', rutaPDF);
    console.log('='.repeat(80));

    // Leer el archivo PDF
    const dataBuffer = fs.readFileSync(rutaPDF);
    
    // Convertir Buffer a Uint8Array (requerido por pdf-parse)
    const uint8Array = new Uint8Array(dataBuffer);
    
    // Crear instancia de PDFParse
    const parser = new PDFParse(uint8Array);
    
    // Cargar el PDF
    await parser.load();
    
    // Obtener información
    const info = await parser.getInfo();
    
    // Obtener el texto
    const textData = await parser.getText();
    
    // El método getText() retorna un objeto con páginas
    // Concatenar el texto de todas las páginas
    let text = '';
    if (textData.pages && Array.isArray(textData.pages)) {
      text = textData.pages.map(page => page.text).join('\n');
    } else if (typeof textData === 'string') {
      text = textData;
    } else {
      console.log('Estructura de textData:', textData);
      text = JSON.stringify(textData, null, 2);
    }

    console.log('\n📊 INFORMACIÓN DEL PDF:');
    console.log('-'.repeat(80));
    console.log('Información del documento:', info);
    
    console.log('\n📝 CONTENIDO EXTRAÍDO (TEXTO COMPLETO):');
    console.log('-'.repeat(80));
    console.log(text);
    console.log('-'.repeat(80));
    
    console.log('\n📏 LONGITUD DEL TEXTO:', text.length, 'caracteres');
    
    // Guardar el texto en un archivo para análisis
    const outputPath = path.join(__dirname, 'test-pdfs', 'texto-extraido.txt');
    fs.writeFileSync(outputPath, text, 'utf-8');
    console.log('\n💾 Texto guardado en:', outputPath);
    
    console.log('\n✅ Lectura completada exitosamente\n');
    
    // Limpiar recursos
    await parser.destroy();
    
    return text;

  } catch (error) {
    console.error('\n❌ ERROR al leer el PDF:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Obtener la ruta del PDF desde los argumentos de línea de comandos
const rutaPDF = process.argv[2];

if (!rutaPDF) {
  console.error('\n❌ Error: Debes proporcionar la ruta del PDF');
  console.log('\nUso: node test-pdf-reader.js <ruta-al-pdf>');
  console.log('Ejemplo: node test-pdf-reader.js "./test-pdfs/ejemplo.pdf"\n');
  process.exit(1);
}

// Verificar que el archivo existe
if (!fs.existsSync(rutaPDF)) {
  console.error('\n❌ Error: El archivo no existe:', rutaPDF, '\n');
  process.exit(1);
}

// Ejecutar la lectura
leerPDF(rutaPDF);
