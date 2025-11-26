/**
 * Script para analizar plantillas Word (.docx) y ver las variables que contienen
 */

const fs = require('fs');
const PizZip = require('pizzip');

function analizarPlantilla(rutaPlantilla) {
  try {
    console.log('\n📄 ANALIZANDO PLANTILLA:', rutaPlantilla);
    console.log('='.repeat(80));
    
    // Leer el archivo .docx (es un archivo ZIP)
    const content = fs.readFileSync(rutaPlantilla, 'binary');
    const zip = new PizZip(content);
    
    // Extraer el documento principal (document.xml)
    const documentXml = zip.file('word/document.xml').asText();
    
    // Buscar todas las variables entre llaves {VARIABLE}
    const variablesRegex = /\{([A-Z_]+)\}/g;
    const variables = [];
    let match;
    
    while ((match = variablesRegex.exec(documentXml)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    console.log('\n✅ VARIABLES ENCONTRADAS:', variables.length);
    console.log('-'.repeat(80));
    
    variables.sort().forEach((variable, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. {${variable}}`);
    });
    
    console.log('\n📝 CONTENIDO DEL DOCUMENTO (primeros 2000 caracteres):');
    console.log('-'.repeat(80));
    
    // Mostrar una porción del XML para ver la estructura
    // Limpiar un poco el XML para hacerlo más legible
    const xmlLimpio = documentXml
      .replace(/<w:t>/g, '')
      .replace(/<\/w:t>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(xmlLimpio.substring(0, 2000));
    console.log('\n...(contenido truncado)...\n');
    
    console.log('='.repeat(80));
    console.log('✅ Análisis completado\n');
    
    return variables;
    
  } catch (error) {
    console.error('\n❌ ERROR al analizar plantilla:', error.message);
    console.error(error);
  }
}

// Analizar la plantilla A
const plantillaA = './templates/PlantillaA.docx';
console.log('\n🔍 ANÁLISIS DE PLANTILLAS WORD');

if (fs.existsSync(plantillaA)) {
  analizarPlantilla(plantillaA);
} else {
  console.error('❌ No se encontró la plantilla:', plantillaA);
}
