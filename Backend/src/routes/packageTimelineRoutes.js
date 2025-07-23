const express = require('express');
const router = express.Router();
const packageTimelineController = require('../controllers/packageTimelineController');
const auth = require('../middleware/auth');

// Ruta para crear un nuevo registro en el timeline
router.post('/timeline', auth, packageTimelineController.createTimelineEntry);

// Ruta para obtener el timeline de un paquete específico
router.get('/timeline/:packageId', auth, packageTimelineController.getPackageTimeline);

module.exports = router; 