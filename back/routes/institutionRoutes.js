const express = require('express');
const institutionService = require('../services/institutionService');

const router = express.Router();

router.get('/instituciones', async (_req, res) => {
  try {
    const institutions = await institutionService.list();
    res.json({ success: true, data: institutions });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/instituciones', async (req, res) => {
  try {
    const institution = await institutionService.create(req.body);
    res.status(201).json({ success: true, data: institution });
  } catch (error) {
    sendError(res, error);
  }
});

router.put('/instituciones/:id', async (req, res) => {
  try {
    const institution = await institutionService.update(req.params.id, req.body);
    res.json({ success: true, data: institution });
  } catch (error) {
    sendError(res, error);
  }
});

function sendError(res, error) {
  const status = error.statusCode || 500;
  if (status === 500) console.error('Error de instituciones:', error);
  res.status(status).json({ success: false, message: error.message });
}

module.exports = router;
