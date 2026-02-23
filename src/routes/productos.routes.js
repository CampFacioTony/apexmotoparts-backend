const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Importamos a Zod y a nuestro guardia
const { crearProductoSchema, actualizarProductoSchema } = require('../schemas/producto.schema');
const { validarEsquema } = require('../middlewares/validator.middleware');

router.get('/', productosController.getProductos);

// ¡AQUÍ ESTÁ LA MAGIA! Metemos validarEsquema en medio de la ruta y el controlador
router.post('/', verificarToken, validarEsquema(crearProductoSchema), productosController.crearProducto);

// 3. ACTUALIZAR (PUT) - Nota el "/:id" en la ruta
router.put('/:id', verificarToken, validarEsquema(actualizarProductoSchema), productosController.actualizarProducto);

// 4. ELIMINAR (DELETE)
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;