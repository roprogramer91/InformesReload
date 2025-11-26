/**
 * Rutas para actualización de mediciones del paciente
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/actualizar-mediciones
 * Actualiza las mediciones diurnas y nocturnas del paciente
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
    
    console.log('✅ Mediciones actualizadas:', {
      paciente: pacienteActualizado.nombre,
      diurnas,
      nocturnas
    });
    
    res.json({
      success: true,
      data: pacienteActualizado,
      message: 'Mediciones actualizadas correctamente'
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
