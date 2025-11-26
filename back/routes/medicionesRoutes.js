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
    
    // Validar que se recibieron los datos necesarios
    if (!paciente) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió el objeto paciente'
      });
    }
    
    if (medicionesDiurnas === undefined || medicionesNocturnas === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan las mediciones diurnas o nocturnas'
      });
    }
    
    // Validar que las mediciones sean números
    const diurnas = parseInt(medicionesDiurnas);
    const nocturnas = parseInt(medicionesNocturnas);
    
    if (isNaN(diurnas) || isNaN(nocturnas)) {
      return res.status(400).json({
        success: false,
        message: 'Las mediciones deben ser números válidos'
      });
    }
    
    // Actualizar el paciente con las mediciones
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
