const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { generarCaratulaDocx, institucionTieneCaratula } = require('../functions/generarCaratula');
const { convertirDocxAPdf } = require('../functions/convertirPDF');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/agregar-caratula
 * Agrega carátula institucional al inicio de un PDF
 *
 * Body (multipart):
 *   - institucionId: string (consultoriosMedicos | darmed)
 *   - pdfFile: PDF al que se le agrega la carátula
 */
router.post('/agregar-caratula', upload.single('pdfFile'), async (req, res) => {
  try {
    const pdfFile = req.file;
    const institucionId = req.body.institucionId;

    if (!pdfFile) {
      return res.status(400).json({ success: false, message: 'Se requiere el archivo PDF' });
    }
    if (!institucionId) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID de institución' });
    }
    if (!institucionTieneCaratula(institucionId)) {
      return res.status(400).json({ success: false, message: `La institución ${institucionId} no tiene carátula` });
    }

    const nombrePaciente = pdfFile.originalname.replace(/\.pdf$/i, '').trim();
    console.log('📋 Agregando carátula para:', nombrePaciente, '| Institución:', institucionId);

    const merged = await PDFDocument.create();

    // 1. Generar carátula y agregarla primero
    const caratulaDocx = generarCaratulaDocx(nombrePaciente, institucionId);
    const { buffer: caratulaPdf } = convertirDocxAPdf(caratulaDocx);
    const docCaratula = await PDFDocument.load(caratulaPdf);
    const pagesCaratula = await merged.copyPages(docCaratula, docCaratula.getPageIndices());
    pagesCaratula.forEach(p => merged.addPage(p));
    console.log('✅ Carátula agregada');

    // 2. PDF del informe
    const docPdf = await PDFDocument.load(pdfFile.buffer);
    const pagesPdf = await merged.copyPages(docPdf, docPdf.getPageIndices());
    pagesPdf.forEach(p => merged.addPage(p));

    const pdfBuffer = Buffer.from(await merged.save());
    const nombreArchivo = `${nombrePaciente}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ PDF con carátula generado:', nombreArchivo);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al agregar carátula:', error);
    res.status(500).json({ success: false, message: 'Error al agregar la carátula', error: error.message });
  }
});

module.exports = router;
