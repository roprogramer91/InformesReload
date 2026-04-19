/**
 * Rutas para generación y descarga de informes Word
 */

const express = require('express');
const router = express.Router();
const { generarInforme } = require('../functions/crearInforme');
const { validarEstudioCompleto } = require('../config/config');

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

    // Generar el informe
    const buffer = generarInforme(paciente, institucionId);
    
    // Preparar nombre del archivo
    const nombreArchivo = `${paciente.nombre.replace(/\s+/g, '_')}_MAPA.docx`;
    
    // Configurar headers para la descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log('✅ Informe generado exitosamente:', nombreArchivo);
    
    // Enviar el archivo
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
