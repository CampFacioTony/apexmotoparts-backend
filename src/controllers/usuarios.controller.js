const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRAR USUARIO
const registrarUsuario = async (req, res) => {
    try {
        const { nombre_completo, email, password, telefono } = req.body;

        // Magia de Bcrypt: Mezclamos y encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Guardamos en TU tabla (Fíjate que usamos tus nombres de columnas exactos)
        const query = `
            INSERT INTO usuarios (nombre_completo, email, password_hash, telefono)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nombre_completo, email, telefono, activo; 
            -- OJO: Devolvemos los datos PERO NUNCA el password_hash por seguridad
        `;
        
        const result = await pool.query(query, [nombre_completo, email, password_hash, telefono]);

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        // El código 23505 significa que el correo ya existe
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ese correo ya está registrado' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 2. INICIAR SESIÓN (LOGIN)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos si el correo existe y si el usuario está activo
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
        
        // Si no existe, rebotamos (Mensaje genérico por seguridad)
        if (result.rowCount === 0) {
            return res.status(401).json({ status: 'error', message: 'Correo o contraseña incorrectos' });
        }

        const usuario = result.rows[0];

        // Bcrypt compara la contraseña de Postman con el Hash raro de la Base de Datos
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        
        if (!passwordValida) {
            return res.status(401).json({ status: 'error', message: 'Correo o contraseña incorrectos' });
        }

        // Si todo coincide, FIRMAMOS EL GAFETE VIP (Token JWT)
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email }, // Datos ocultos en el gafete
            process.env.JWT_SECRET, // Tu llave secreta del .env
            { expiresIn: '8h' } // El usuario se cerrará sesión solo en 8 horas
        );

        res.status(200).json({
            status: 'success',
            message: 'Bienvenido a ApexMotoParts',
            token: token, // <-- ¡Este es el Gafete que usarán en la app web!
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                email: usuario.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

module.exports = { registrarUsuario, login };