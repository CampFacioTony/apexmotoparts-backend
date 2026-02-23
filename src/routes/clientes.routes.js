const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { crearClienteSchema } = require('../schemas/crm.schema');

router.post('/', verificarToken, validarEsquema(crearClienteSchema), clientesController.crearCliente);
router.get('/', verificarToken, clientesController.getClientes);

module.exports = router;