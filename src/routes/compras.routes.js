const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/compras.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { registrarCompraSchema } = require('../schemas/compra.schema');

// Ruta súper protegida para dar entrada a la mercancía
router.post('/entrada', verificarToken, validarEsquema(registrarCompraSchema), comprasController.registrarEntrada);

module.exports = router;