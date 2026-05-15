const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

const CARATULAS = {
  consultoriosMedicos: 'CaratulaA.docx',
  darmed: 'CaratulaC.docx'
};

function institucionTieneCaratula(institucionId) {
  return !!CARATULAS[institucionId];
}

function generarCaratulaDocx(nombre, institucionId) {
  const archivo = CARATULAS[institucionId];
  if (!archivo) throw new Error(`La institución ${institucionId} no tiene carátula`);

  const plantillaPath = path.join(__dirname, '../templates', archivo);
  const content = fs.readFileSync(plantillaPath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render({ nombre });

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { generarCaratulaDocx, institucionTieneCaratula };
