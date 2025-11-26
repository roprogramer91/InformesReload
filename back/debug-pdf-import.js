// Test para ver cómo usar PDFParse
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const testPDF = './test-pdfs/BARRIOS ANTONIA-P.pdf';
const dataBuffer = fs.readFileSync(testPDF);

console.log('Tipo de PDFParse:', typeof PDFParse);
console.log('¿Es una clase?:', PDFParse.prototype ? 'SÍ' : 'NO');

// Intentar crear instancia
try {
  const parser = new PDFParse(dataBuffer);
  console.log('Instancia creada');
  console.log('Métodos disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
} catch (e) {
  console.error('Error al crear instancia:', e.message);
}
