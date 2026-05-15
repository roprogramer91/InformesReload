const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ====================
// MIDDLEWARE
// ====================

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: '*', // En producción, especificar el dominio del frontend
  exposedHeaders: ['Content-Disposition'] // Necesario para descargas de archivos
}));

// Morgan - Logger de peticiones HTTP
app.use(morgan('dev'));

// Parsear JSON y URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ====================
// RUTAS
// ====================

// Importar rutas
const pdfRoutes = require('./routes/pdfRoutes');
const medicionesRoutes = require('./routes/medicionesRoutes');
const informeRoutes = require('./routes/informeRoutes');
const awpRoutes = require('./routes/awpRoutes');
const unirPdfsRoutes = require('./routes/unirPdfsRoutes');

// Usar rutas
app.use('/api', pdfRoutes);
app.use('/api', medicionesRoutes);
app.use('/api', informeRoutes);
app.use('/api', awpRoutes);
app.use('/api', unirPdfsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🩺 Informatron API - Generador de Informes MAPA',
    version: '1.0.0',
    endpoints: {
      test: 'GET /test',
      uploadPDF: 'POST /api/upload-pdf',
      updateMediciones: 'POST /api/actualizar-mediciones',
      generarInforme: 'POST /api/generar-informe'
    }
  });
});

// Ruta de prueba
app.get('/test', (req, res) => {
  res.send('✅ El servidor está corriendo correctamente.');
});

// ====================
// PUERTO Y ARRANQUE
// ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Informatron API iniciado`);
  console.log(`📡 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   GET  / - Información de la API`);
  console.log(`   GET  /test - Prueba de conectividad`);
  console.log(`   POST /api/upload-pdf - Cargar PDF MAPA`);
  console.log(`   POST /api/actualizar-mediciones - Actualizar mediciones`);
  console.log(`   POST /api/generar-informe - Generar y descargar informe Word`);
});