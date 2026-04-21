const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function libreOfficeDisponible() {
  try {
    execSync('libreoffice --version', { timeout: 5000, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const _libreDisponible = libreOfficeDisponible();
console.log(_libreDisponible ? '✅ LibreOffice disponible — salida en PDF' : '⚠️  LibreOffice no disponible — salida en DOCX (solo local)');

/**
 * Convierte un buffer DOCX a PDF usando LibreOffice headless.
 * Si LibreOffice no está instalado (entorno local Windows), devuelve el DOCX original.
 * Retorna: { buffer, tipo: 'pdf' | 'docx' }
 */
function convertirDocxAPdf(docxBuffer) {
  if (!_libreDisponible) {
    return { buffer: docxBuffer, tipo: 'docx' };
  }

  const tmpDir = os.tmpdir();
  const baseName = `mapa_${Date.now()}`;
  const tmpDocx = path.join(tmpDir, `${baseName}.docx`);
  const tmpPdf = path.join(tmpDir, `${baseName}.pdf`);

  try {
    fs.writeFileSync(tmpDocx, docxBuffer);
    execSync(`libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${tmpDocx}"`, { timeout: 30000 });
    const pdfBuffer = fs.readFileSync(tmpPdf);
    return { buffer: pdfBuffer, tipo: 'pdf' };
  } finally {
    if (fs.existsSync(tmpDocx)) fs.unlinkSync(tmpDocx);
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
}

module.exports = { convertirDocxAPdf };
