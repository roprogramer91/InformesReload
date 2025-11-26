/**
 * Rutas para manejo de carga y procesamiento de PDFs
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { leerTextoDelPDF } = require('../functions/pdfExtractor');
const { construirPaciente } = require('../functions/crearPaciente');

// Configurar multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/upload-pdf
 * Procesa un archivo PDF con datos MAPA y retorna el objeto paciente
 */
router.post('/upload-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    // Verificar que se envió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo PDF'
      });
    }
    
    // Verificar que es un PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe ser un PDF'
      });
    }
    
    console.log('📄 Procesando PDF:', req.file.originalname);
    
    // Extraer texto del PDF
    const textoPDF = await leerTextoDelPDF(req.file.buffer);
    console.log('✅ Texto extraído:', textoPDF.length, 'caracteres');
    
    // Construir objeto paciente
    const paciente = construirPaciente(textoPDF);
    console.log('✅ Paciente creado:', paciente.nombre);
    
    // Retornar datos del paciente
    res.json({
      success: true,
      data: paciente,
      message: 'Carga exitosa. Por favor, ingrese las mediciones diurnas y nocturnas.'
    });
    
  } catch (error) {
    console.error('❌ Error al procesar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el PDF',
      error: error.message
    });
  }
});

module.exports = router;
