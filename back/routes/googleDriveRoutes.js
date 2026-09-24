const express = require('express');
const googleDriveService = require('../services/googleDriveService');

function createGoogleDriveRouter(service = googleDriveService) {
  const router = express.Router();

  router.get('/google/drive/folders', async (_req, res) => {
    try {
      res.json({ folders: await service.listFolders() });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get('/google/drive/mapa/work-folders', async (_req, res) => {
    try {
      res.json(await service.getMapaWorkFolders());
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error('Error interno al consultar Google Drive');
  res.status(statusCode).json({
    success: false,
    code: error.code || 'GOOGLE_DRIVE_ERROR',
    message: statusCode >= 500 && !error.exposeMessage
      ? 'No se pudieron listar las carpetas de Google Drive'
      : error.message,
  });
}

module.exports = createGoogleDriveRouter();
module.exports.createGoogleDriveRouter = createGoogleDriveRouter;
