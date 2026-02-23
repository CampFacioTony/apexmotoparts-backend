const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');

// Importamos a los guardias
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { registrarVentaSchema } = require('../schemas/venta.schema');

// Ruta para cobrar (Tiene que estar súper protegida con el Gafete VIP)
router.post('/', verificarToken, validarEsquema(registrarVentaSchema), ventasController.realizarVenta);

module.exports = router;