const express = require('express');
const googleAuthService = require('../services/googleAuthService');

function createGoogleAuthRouter(service = googleAuthService) {
  const router = express.Router();

  router.get('/google/status', async (_req, res) => {
    try {
      res.json(await service.getStatus());
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get('/google/auth', (_req, res) => {
    try {
      res.json({ authorizationUrl: service.generateAuthorizationUrl() });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get('/google/callback', async (req, res) => {
    try {
      const status = await service.exchangeCodeForTokens(req.query.code, req.query.state);
      res.json({
        success: true,
        message: 'Google fue autorizado correctamente',
        authenticated: status.authenticated,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  if (statusCode === 500) console.error('Error de Google OAuth:', error);
  res.status(statusCode).json({
    success: false,
    code: error.code || 'GOOGLE_AUTH_ERROR',
    message: statusCode === 500 ? 'No se pudo completar la autenticación con Google' : error.message,
  });
}

module.exports = createGoogleAuthRouter();
module.exports.createGoogleAuthRouter = createGoogleAuthRouter;

