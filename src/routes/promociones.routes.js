const express = require('express');
const router = express.Router();
const promocionesController = require('../controllers/promociones.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { crearPromocionSchema } = require('../schemas/crm.schema');

router.post('/', verificarToken, validarEsquema(crearPromocionSchema), promocionesController.crearPromocion);
router.get('/', verificarToken, promocionesController.getPromociones);

module.exports = router;