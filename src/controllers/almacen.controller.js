const pool = require('../config/db');

// 1. CREAR una ubicación física (El mapa)
const crearUbicacion = async (req, res) => {
    try {
        const { zona, pasillo, rack, nivel, codigo_barras } = req.body;
        const query = `
            INSERT INTO ubicaciones (zona, pasillo, rack, nivel, codigo_barras)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await pool.query(query, [zona, pasillo, rack, nivel, codigo_barras]);
        res.status(201).json({ status: 'success', message: 'Ubicación creada', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ese código de barras de ubicación ya existe' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 2. DEPOSITAR inventario (Meter piezas al rack)
const depositarInventario = async (req, res) => {
    try {
        const { producto_id, ubicacion_id, cantidad } = req.body;
        
        // Magia de Postgres: Si ya existe la pieza en ese rack, solo suma la cantidad nueva
        const query = `
            INSERT INTO inventario_fisico (producto_id, ubicacion_id, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (producto_id, ubicacion_id) 
            DO UPDATE SET 
                cantidad = inventario_fisico.cantidad + EXCLUDED.cantidad,
                ultima_actualizacion = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await pool.query(query, [producto_id, ubicacion_id, cantidad]);
        res.status(200).json({ status: 'success', message: 'Inventario depositado con éxito', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error al depositar inventario' });
    }
};

// 3. BUSCAR dónde está guardado un producto específico
const localizarProducto = async (req, res) => {
    try {
        const { producto_id } = req.params;
        const query = `
            SELECT u.zona, u.pasillo, u.rack, u.nivel, u.codigo_barras, i.cantidad 
            FROM inventario_fisico i
            INNER JOIN ubicaciones u ON i.ubicacion_id = u.id
            WHERE i.producto_id = $1 AND i.cantidad > 0;
        `;
        const result = await pool.query(query, [producto_id]);
        res.status(200).json({ status: 'success', total_ubicaciones: result.rowCount, data: result.rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al buscar producto' });
    }
};

module.exports = { crearUbicacion, depositarInventario, localizarProducto };