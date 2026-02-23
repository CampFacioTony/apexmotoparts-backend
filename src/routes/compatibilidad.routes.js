const express = require('express');
const router = express.Router();
const compatibilidadController = require('../controllers/compatibilidad.controller');

const { validarEsquema } = require('../middlewares/validator.middleware');
const { agregarCompatibilidadSchema } = require('../schemas/compatibilidad.schema');

// Ruta para CREAR el enlace (POST)
router.post('/', validarEsquema(agregarCompatibilidadSchema), compatibilidadController.agregarCompatibilidad);

// Ruta para BUSCAR piezas pasándole el ID del vehículo en la URL (GET)
router.get('/vehiculo/:vehiculo_id', compatibilidadController.getProductosPorVehiculo);

module.exports = router;