const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { validarEsquema } = require('../middlewares/validator.middleware');
const { registrarUsuarioSchema, loginSchema } = require('../schemas/usuario.schema');

// Ruta para Registrar (POST)
router.post('/registro', validarEsquema(registrarUsuarioSchema), usuariosController.registrarUsuario);

// Ruta para Hacer Login (POST)
router.post('/login', validarEsquema(loginSchema), usuariosController.login);

module.exports = router;