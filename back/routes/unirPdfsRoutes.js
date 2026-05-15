const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/unir-pdfs
 * Recibe dos archivos PDF y devuelve un único PDF combinado
 */
router.post('/unir-pdfs', upload.fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 }
]), async (req, res) => {
  try {
    const pdf1 = req.files?.pdf1?.[0];
    const pdf2 = req.files?.pdf2?.[0];

    if (!pdf1 || !pdf2) {
      return res.status(400).json({ success: false, message: 'Se requieren dos archivos PDF' });
    }

    const merged = await PDFDocument.create();

    const doc1 = await PDFDocument.load(pdf1.buffer);
    const doc2 = await PDFDocument.load(pdf2.buffer);

    const pages1 = await merged.copyPages(doc1, doc1.getPageIndices());
    pages1.forEach(page => merged.addPage(page));

    const pages2 = await merged.copyPages(doc2, doc2.getPageIndices());
    pages2.forEach(page => merged.addPage(page));

    const pdfBuffer = Buffer.from(await merged.save());

    // Nombre basado en el primer archivo, sin extensión, + sufijo
    const baseName = pdf1.originalname.replace(/\.pdf$/i, '').replace(/-P$/i, '').trim();
    const nombreArchivo = `${baseName}-COMBINADO.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ PDFs combinados:', nombreArchivo);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al unir PDFs:', error);
    res.status(500).json({ success: false, message: 'Error al unir los PDFs', error: error.message });
  }
});

module.exports = router;
