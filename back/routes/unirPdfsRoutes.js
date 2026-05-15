const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { generarCaratulaDocx, institucionTieneCaratula } = require('../functions/generarCaratula');
const { convertirDocxAPdf } = require('../functions/convertirPDF');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/unir-pdfs
 * Combina informe sin-P + con-P, y agrega carátula automática si corresponde
 *
 * Body (multipart):
 *   - institucionId: string
 *   - pdfSinP: PDF del informe médico (sin -P)
 *   - pdfConP: PDF del informe ABPM (con -P)
 */
router.post('/unir-pdfs', upload.fields([
  { name: 'pdfSinP', maxCount: 1 },
  { name: 'pdfConP', maxCount: 1 }
]), async (req, res) => {
  try {
    const pdfSinP = req.files?.pdfSinP?.[0];
    const pdfConP = req.files?.pdfConP?.[0];
    const institucionId = req.body.institucionId;

    if (!pdfSinP || !pdfConP) {
      return res.status(400).json({ success: false, message: 'Se requieren los dos archivos PDF' });
    }
    if (!institucionId) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID de institución' });
    }

    // Nombre del paciente desde el nombre del archivo sin-P (sin extensión)
    const nombrePaciente = pdfSinP.originalname.replace(/\.pdf$/i, '').trim();
    console.log('📎 Uniendo PDFs para:', nombrePaciente, '| Institución:', institucionId);

    const merged = await PDFDocument.create();

    // 1. Si la institución tiene carátula, generarla y agregarla primero
    if (institucionTieneCaratula(institucionId)) {
      console.log('📋 Generando carátula...');
      const caratulaDocx = generarCaratulaDocx(nombrePaciente, institucionId);
      const { buffer: caratulaPdf } = convertirDocxAPdf(caratulaDocx);
      const docCaratula = await PDFDocument.load(caratulaPdf);
      const pagesCaratula = await merged.copyPages(docCaratula, docCaratula.getPageIndices());
      pagesCaratula.forEach(p => merged.addPage(p));
      console.log('✅ Carátula agregada');
    }

    // 2. Informe sin -P
    const docSinP = await PDFDocument.load(pdfSinP.buffer);
    const pagesSinP = await merged.copyPages(docSinP, docSinP.getPageIndices());
    pagesSinP.forEach(p => merged.addPage(p));

    // 3. Informe con -P
    const docConP = await PDFDocument.load(pdfConP.buffer);
    const pagesConP = await merged.copyPages(docConP, docConP.getPageIndices());
    pagesConP.forEach(p => merged.addPage(p));

    const pdfBuffer = Buffer.from(await merged.save());
    const nombreArchivo = `${nombrePaciente}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ PDF combinado:', nombreArchivo);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al unir PDFs:', error);
    res.status(500).json({ success: false, message: 'Error al unir los PDFs', error: error.message });
  }
});

module.exports = router;
