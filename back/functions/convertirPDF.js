const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function convertirDocxAPdf(docxBuffer) {
  const tmpDir = os.tmpdir();
  const baseName = `mapa_${Date.now()}`;
  const tmpDocx = path.join(tmpDir, `${baseName}.docx`);
  const tmpPdf = path.join(tmpDir, `${baseName}.pdf`);

  try {
    fs.writeFileSync(tmpDocx, docxBuffer);
    execSync(`libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${tmpDocx}"`, {
      timeout: 30000
    });
    const pdfBuffer = fs.readFileSync(tmpPdf);
    return pdfBuffer;
  } finally {
    if (fs.existsSync(tmpDocx)) fs.unlinkSync(tmpDocx);
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
  }
}

module.exports = { convertirDocxAPdf };
