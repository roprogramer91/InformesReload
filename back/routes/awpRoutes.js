const express = require('express');
const router = express.Router();
const multer = require('multer');
const { construirPacienteDesdeAwpBuffer } = require('../functions/parseAwp');
const { generarInforme } = require('../functions/crearInforme');
const { convertirDocxAPdf } = require('../functions/convertirPDF');
const { validarEstudioCompleto } = require('../config/config');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/procesar-awp
 * Recibe un archivo .awp + institucionId, devuelve PDF o 422 si insuficiente
 */
router.post('/procesar-awp', upload.single('awpFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió el archivo AWP' });
    }

    const institucionId = req.body.institucionId;
    if (!institucionId) {
      return res.status(400).json({ success: false, message: 'No se recibió el ID de institución' });
    }

    console.log('📂 Procesando AWP:', req.file.originalname);

    const paciente = construirPacienteDesdeAwpBuffer(req.file.buffer);

    console.log('👤 Paciente:', paciente.nombre, '| Diurnas:', paciente.medicionesDiurnas, '| Nocturnas:', paciente.medicionesNocturnas);

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

    const docxBuffer = generarInforme(paciente, institucionId);
    const { buffer, tipo } = convertirDocxAPdf(docxBuffer);

    const nombreArchivo = `${paciente.nombre}.${tipo}`;
    const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);

    console.log('✅ AWP procesado exitosamente:', nombreArchivo);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error al procesar AWP:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el archivo AWP', error: error.message });
  }
});

module.exports = router;
