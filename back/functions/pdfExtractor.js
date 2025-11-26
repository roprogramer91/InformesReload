/**
 * Extractor de PDF para archivos ABPM (Monitoreo Ambulatorio de Presión Arterial)
 * 
 * Este módulo se encarga de leer archivos PDF y extraer el texto completo
 * utilizando la librería pdf-parse.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse');

/**
 * Lee un archivo PDF y extrae todo su contenido de texto
 * 
 * @param {Buffer} pdfBuffer - Buffer con el contenido del archivo PDF
 * @returns {Promise<string>} - Promesa que resuelve con el texto extraído del PDF
 * @throws {Error} - Si hay un error al procesar el PDF
 */
async function leerTextoDelPDF(pdfBuffer) {
  try {
    // Convertir Buffer a Uint8Array (requerido por pdf-parse)
    const uint8Array = new Uint8Array(pdfBuffer);
    
    // Crear instancia del parser
    const parser = new PDFParse(uint8Array);
    
    // Cargar el PDF
    await parser.load();
    
    // Obtener el texto
    const textData = await parser.getText();
    
    // El método getText() retorna un objeto con páginas
    // Concatenar el texto de todas las páginas
    let texto = '';
    if (textData.pages && Array.isArray(textData.pages)) {
      texto = textData.pages.map(page => page.text).join('\n');
    } else if (typeof textData === 'string') {
      texto = textData;
    }
    
    // Limpiar recursos
    await parser.destroy();
    
    return texto;
    
  } catch (error) {
    console.error('Error al leer el PDF:', error);
    throw new Error(`Error al extraer texto del PDF: ${error.message}`);
  }
}

module.exports = {
  leerTextoDelPDF
};
