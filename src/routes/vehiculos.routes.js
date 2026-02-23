const express = require('express');
const router = express.Router();
const vehiculosController = require('../controllers/vehiculos.controller');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { crearVehiculoSchema, actualizarVehiculoSchema } = require('../schemas/vehiculo.schema');

// Definimos el CRUD
router.get('/', vehiculosController.getVehiculos);
router.post('/', validarEsquema(crearVehiculoSchema), vehiculosController.crearVehiculo);
router.put('/:id', validarEsquema(actualizarVehiculoSchema), vehiculosController.actualizarVehiculo);
router.delete('/:id', vehiculosController.eliminarVehiculo);

module.exports = router;