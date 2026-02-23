const pool = require('../config/db');

// 1. CREAR el enlace (Asignar pieza a vehículo)
const agregarCompatibilidad = async (req, res) => {
    try {
        const { producto_id, vehiculo_id, anio_especifico_inicio, anio_especifico_fin } = req.body;

        const query = `
            INSERT INTO compatibilidad_vehiculos (producto_id, vehiculo_id, anio_especifico_inicio, anio_especifico_fin)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [producto_id, vehiculo_id, anio_especifico_inicio, anio_especifico_fin];
        const result = await pool.query(query, values);

        res.status(201).json({
            status: 'success',
            message: 'Compatibilidad registrada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al registrar compatibilidad:', error);
        // Si el error es 23505, intentaron registrar la misma pieza a la misma moto dos veces
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Esta pieza ya está vinculada a este vehículo.' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 2. BUSCAR refacciones para un vehículo específico
const getProductosPorVehiculo = async (req, res) => {
    try {
        const { vehiculo_id } = req.params;

        // Hacemos un JOIN: Traemos los productos activos que estén enlazados a este vehículo
        const query = `
            SELECT p.*, cv.anio_especifico_inicio, cv.anio_especifico_fin 
            FROM productos p
            INNER JOIN compatibilidad_vehiculos cv ON p.id = cv.producto_id
            WHERE cv.vehiculo_id = $1 AND p.activo = true;
        `;
        
        const result = await pool.query(query, [vehiculo_id]);

        res.status(200).json({
            status: 'success',
            total: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al buscar compatibilidades:', error);
        res.status(500).json({ status: 'error', message: 'Error en base de datos' });
    }
};

module.exports = {
    agregarCompatibilidad,
    getProductosPorVehiculo
};