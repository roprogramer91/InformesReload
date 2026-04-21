/**
 * Rutas para generación y descarga de informes Word
 */

const express = require('express');
const router = express.Router();
const { generarInforme } = require('../functions/crearInforme');
const { validarEstudioCompleto } = require('../config/config');
const { convertirDocxAPdf } = require('../functions/convertirPDF');

/**
 * POST /api/generar-informe
 * Genera un informe médico en formato Word y lo retorna para descarga
 * 
 * Body esperado:
 * {
 *   paciente: { objeto con todos los datos del paciente },
 *   institucionId: 'consultoriosMedicos' | 'vitalNorte'
 * }
 */
router.post('/generar-informe', async (req, res) => {
  try {
    const { paciente, institucionId } = req.body;
    
    // Validar que se recibieron los datos necesarios
    if (!paciente) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió el objeto paciente'
      });
    }
    
    if (!institucionId) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió el ID de la institución'
      });
    }
    
    // Validar que el paciente tenga mediciones
    if (!paciente.medicionesDiurnas || !paciente.medicionesNocturnas) {
      return res.status(400).json({
        success: false,
        message: 'El paciente no tiene mediciones diurnas y nocturnas'
      });
    }
    
    console.log('📄 Generando informe para:', paciente.nombre);
    console.log('🏥 Institución:', institucionId);

    // Validar estudio antes de generar
    const validacion = validarEstudioCompleto(
      paciente.duracionHoras || 0,
      paciente.medicionesDiurnas || 0,
      paciente.medicionesNocturnas || 0
    );

    if (!validacion.valido) {
      console.log('⚠️ Estudio insuficiente:', validacion.motivos);
      return res.status(422).json({
        insuficiente: true,
        nombre: paciente.nombre,
        fecha: paciente.fechaFormateada
      });
    }

    // Generar el DOCX y convertir a PDF (o DOCX si LibreOffice no disponible)
    const docxBuffer = generarInforme(paciente, institucionId);
    const { buffer, tipo } = convertirDocxAPdf(docxBuffer);

    const nombreArchivo = `${paciente.nombre}.${tipo}`;
    const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);

    console.log('✅ Informe generado exitosamente:', nombreArchivo);

    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error al generar informe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el informe',
      error: error.message
    });
  }
});

module.exports = router;
