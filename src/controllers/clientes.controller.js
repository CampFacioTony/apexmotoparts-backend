const pool = require('../config/db');

const crearCliente = async (req, res) => {
    try {
        const { nombre_completo, email, telefono, nivel_lealtad = 'BRONCE' } = req.body;
        const usuario_id = req.usuario.id; // <-- Extraemos al empleado en turno

        const query = `
            INSERT INTO clientes (nombre_completo, email, telefono, nivel_lealtad, creado_por)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        // Agregamos el usuario_id al final del arreglo
        const result = await pool.query(query, [nombre_completo, email, telefono, nivel_lealtad, usuario_id]);
        
        res.status(201).json({ status: 'success', message: 'Cliente registrado', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'Este correo ya está registrado' });
        res.status(500).json({ status: 'error', message: 'Error al registrar cliente' });
    }
};

const getClientes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clientes ORDER BY fecha_registro DESC');
        res.status(200).json({ status: 'success', total: result.rowCount, data: result.rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al obtener la lista de clientes' });
    }
};

module.exports = { crearCliente, getClientes };