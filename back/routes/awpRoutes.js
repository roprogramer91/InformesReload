const express = require('express');
const router = express.Router();
const multer = require('multer');
const { construirPacienteDesdeAwpBuffer } = require('../functions/parseAwp');
const { generarInforme } = require('../functions/crearInforme');
const { convertirDocxAPdf } = require('../functions/convertirPDF');
const { validarEstudioCompleto, HORAS_MINIMAS_ESTUDIO } = require('../config/config');

const upload = multer({ storage: multer.memoryStorage() });

function normalizarFechaCorregida(valor) {
  if (!valor) return '';
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('La fecha corregida debe tener formato AAAA-MM-DD');

  const [, year, month, day] = match;
  const fecha = new Date(Number(year), Number(month) - 1, Number(day));
  const valida = fecha.getFullYear() === Number(year)
    && fecha.getMonth() === Number(month) - 1
    && fecha.getDate() === Number(day);
  if (!valida) throw new Error('La fecha corregida no es vÃ¡lida');

  return `${day}/${month}/${year}`;
}

router.post('/inspeccionar-awp', upload.single('awpFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibiÃ³ el archivo AWP' });
    }

    const paciente = construirPacienteDesdeAwpBuffer(req.file.buffer);
    res.json({
      success: true,
      data: {
        nombre: paciente.nombre || req.file.originalname.replace(/\.awp$/i, ''),
        fechaDetectada: paciente.fechaPrimeraMedicion || paciente.fechaFormateada,
        fechaAdministrativa: paciente.fechaAdministrativa || ''
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'No se pudo inspeccionar el AWP', error: error.message });
  }
});

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

    let fechaCorregida = '';
    try {
      fechaCorregida = normalizarFechaCorregida(req.body.fechaCorregida);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const paciente = construirPacienteDesdeAwpBuffer(req.file.buffer, { fechaCorregida });

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
        fecha: paciente.fechaFormateada,
        duracionHoras: paciente.duracionHoras,
        horasMinimas: HORAS_MINIMAS_ESTUDIO
      });
    }

    const docxBuffer = generarInforme(paciente, institucionId);
    const { buffer, tipo } = convertirDocxAPdf(docxBuffer);

    const nombreArchivo = `${paciente.nombre}.${tipo}`;
    const contentType = tipo === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`);
    res.setHeader('Content-Length', buffer.length);

    console.log('✅ AWP procesado exitosamente:', nombreArchivo);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error al procesar AWP:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el archivo AWP', error: error.message });
  }
});

module.exports = router;
