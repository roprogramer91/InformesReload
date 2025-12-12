/**
 * Rutas para actualización de mediciones del paciente
 */

const express = require('express');
const router = express.Router();
const { validarEstudioCompleto, obtenerMedicionesMinimasEstudio, obtenerHorasMinimasEstudio } = require('../config/config');

/**
 * GET /api/criterios-validacion
 * Retorna los criterios mínimos para un estudio válido
 */
router.get('/criterios-validacion', (req, res) => {
  try {
    const criterios = {
      horasMinimas: obtenerHorasMinimasEstudio(),
      mediciones: obtenerMedicionesMinimasEstudio()
    };
    
    res.json({
      success: true,
      data: criterios
    });
  } catch (error) {
    console.error('❌ Error al obtener criterios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener criterios de validación',
      error: error.message
    });
  }
});

/**
 * POST /api/actualizar-mediciones
 * Actualiza las mediciones diurnas y nocturnas del paciente
 * Incluye validación según criterios médicos
 */
router.post('/actualizar-mediciones', (req, res) => {
  try {
    const { paciente, medicionesDiurnas, medicionesNocturnas } = req.body;
    
    // Validar que se recibió el objeto paciente
    if (!paciente) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió el objeto paciente'
      });
    }
    
    let diurnas = paciente.medicionesDiurnas; // Usar valores existentes por defecto
    let nocturnas = paciente.medicionesNocturnas; // Usar valores existentes por defecto

    // Si se proporcionan mediciones diurnas y nocturnas, se usan para actualizar
    if (medicionesDiurnas !== undefined && medicionesNocturnas !== undefined) {
      const parsedDiurnas = parseInt(medicionesDiurnas);
      const parsedNocturnas = parseInt(medicionesNocturnas);
      
      if (isNaN(parsedDiurnas) || isNaN(parsedNocturnas) || parsedDiurnas < 0 || parsedNocturnas < 0) {
        return res.status(400).json({
          success: false,
          message: 'Las mediciones deben ser números válidos y no negativos'
        });
      }
      diurnas = parsedDiurnas;
      nocturnas = parsedNocturnas;
    } else if (medicionesDiurnas !== undefined || medicionesNocturnas !== undefined) {
        // Si solo se proporciona una de las dos, es un error o una lógica no contemplada
        return res.status(400).json({
            success: false,
            message: 'Si se proporcionan mediciones, deben ser ambas (diurnas y nocturnas).'
        });
    }
    
    // Actualizar el paciente con las mediciones (ya sean las nuevas o las originales)
    const pacienteActualizado = {
      ...paciente,
      medicionesDiurnas: diurnas,
      medicionesNocturnas: nocturnas
    };
    
    // Validar estudio completo
    const horas = paciente.duracionHoras || 0;
    const validacion = validarEstudioCompleto(horas, diurnas, nocturnas);
    
    console.log('✅ Mediciones actualizadas:', {
      paciente: pacienteActualizado.nombre,
      diurnas,
      nocturnas,
      horas,
      esValido: validacion.valido
    });
    
    if (!validacion.valido) {
      console.log('⚠️  Advertencia - Estudio no cumple criterios mínimos:');
      validacion.motivos.forEach(motivo => console.log(`   - ${motivo}`));
    }
    
    res.json({
      success: true,
      data: pacienteActualizado,
      validacion: validacion,
      message: validacion.valido 
        ? 'Mediciones actualizadas correctamente' 
        : 'Mediciones actualizadas. ADVERTENCIA: El estudio no cumple los criterios mínimos de validación.'
    });
    
  } catch (error) {
    console.error('❌ Error al actualizar mediciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar las mediciones',
      error: error.message
    });
  }
});

module.exports = router;
