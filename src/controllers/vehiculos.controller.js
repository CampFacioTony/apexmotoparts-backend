const pool = require('../config/db');

// 1. LEER vehículos activos
const getVehiculos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vehiculos_catalogo WHERE activo = true ORDER BY marca, modelo');
        res.status(200).json({ status: 'success', total: result.rowCount, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error en base de datos' });
    }
};

// 2. CREAR vehículo
const crearVehiculo = async (req, res) => {
    try {
        const { tipo, marca, modelo, cilindrada, anio_inicio, anio_fin } = req.body;
        
        const query = `
            INSERT INTO vehiculos_catalogo (tipo, marca, modelo, cilindrada, anio_inicio, anio_fin)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [tipo, marca, modelo, cilindrada, anio_inicio, anio_fin];
        const result = await pool.query(query, values);

        res.status(201).json({ status: 'success', message: 'Vehículo registrado', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 3. ACTUALIZAR vehículo
const actualizarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, marca, modelo, cilindrada, anio_inicio, anio_fin } = req.body;

        const query = `
            UPDATE vehiculos_catalogo 
            SET 
                tipo = COALESCE($1, tipo), marca = COALESCE($2, marca), modelo = COALESCE($3, modelo),
                cilindrada = COALESCE($4, cilindrada), anio_inicio = COALESCE($5, anio_inicio), 
                anio_fin = COALESCE($6, anio_fin)
            WHERE id = $7 AND activo = true
            RETURNING *;
        `;
        const result = await pool.query(query, [tipo, marca, modelo, cilindrada, anio_inicio, anio_fin, id]);

        if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Vehículo no encontrado' });
        res.status(200).json({ status: 'success', message: 'Vehículo actualizado', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno' });
    }
};

// 4. ELIMINAR vehículo (Soft Delete)
const eliminarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE vehiculos_catalogo SET activo = false WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Vehículo no encontrado' });
        res.status(200).json({ status: 'success', message: 'Vehículo eliminado del catálogo' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error interno' });
    }
};

module.exports = { getVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo };