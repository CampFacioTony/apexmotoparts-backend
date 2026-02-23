const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Ruta GET al Dashboard (Protegida por el Gafete VIP)
router.get('/dashboard', verificarToken, reportesController.getDashboard);

module.exports = router;