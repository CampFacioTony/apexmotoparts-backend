const express = require('express');
const router = express.Router();
const almacenController = require('../controllers/almacen.controller');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { crearUbicacionSchema, depositarInventarioSchema } = require('../schemas/almacen.schema');

// 1. Registrar un lugar en el mapa
router.post('/ubicaciones', validarEsquema(crearUbicacionSchema), almacenController.crearUbicacion);

// 2. Depositar piezas en un lugar
router.post('/depositar', validarEsquema(depositarInventarioSchema), almacenController.depositarInventario);

// 3. Localizar dónde está físicamente una pieza
router.get('/localizar/:producto_id', almacenController.localizarProducto);

module.exports = router;