const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');

const WINDOWS_LIBREOFFICE_PATHS = [
  'E:\\LibreOffice\\program\\soffice.exe',
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'LibreOffice', 'program', 'soffice.exe'),
  path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'LibreOffice', 'program', 'soffice.exe'),
];

// En Linux/Railway se conserva el comando disponible en PATH.
// En Windows se usa la primera instalación local encontrada.
const _libreOfficeExecutable = process.platform === 'win32'
  ? WINDOWS_LIBREOFFICE_PATHS.find(fs.existsSync)
  : 'libreoffice';
const _libreDisponible = Boolean(_libreOfficeExecutable);
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
  const libreOfficeProfile = fs.mkdtempSync(path.join(tmpDir, 'informesreload-lo-'));

  try {
    fs.writeFileSync(tmpDocx, docxBuffer);
    execFileSync(
      _libreOfficeExecutable,
      [
        `-env:UserInstallation=${pathToFileURL(libreOfficeProfile).href}`,
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', tmpDir,
        tmpDocx,
      ],
      { timeout: 30000 }
    );
    const pdfBuffer = fs.readFileSync(tmpPdf);
    return { buffer: pdfBuffer, tipo: 'pdf' };
  } finally {
    if (fs.existsSync(tmpDocx)) fs.unlinkSync(tmpDocx);
    if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf);
    fs.rmSync(libreOfficeProfile, { recursive: true, force: true });
  }
}

module.exports = { convertirDocxAPdf };
