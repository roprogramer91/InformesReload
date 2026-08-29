const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const institutionService = require('../services/institutionService');

const CARATULAS = {
  consultoriosMedicos: 'CaratulaA.docx',
  darmed: 'CaratulaC.docx',
  institutoDelta: 'CaratulaD.docx'
};

async function institucionTieneCaratula(institucionId) {
  const institution = await institutionService.getByName(institucionId);
  return !!institution?.hasCover && !!CARATULAS[institucionId];
}

async function generarCaratulaDocx(nombre, institucionId) {
  const institution = await institutionService.getByName(institucionId);
  if (!institution?.hasCover) {
    throw new Error(`La institución ${institucionId} no tiene carátula`);
  }
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
