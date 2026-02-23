const pool = require('../config/db');

const crearPromocion = async (req, res) => {
    try {
        const { codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin } = req.body;
        const query = `
            INSERT INTO promociones (codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        // Usamos .toUpperCase() para que los códigos siempre se guarden en MAYÚSCULAS
        const result = await pool.query(query, [codigo.toUpperCase(), descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin]);
        res.status(201).json({ status: 'success', message: 'Promoción creada', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'Este código de promoción ya existe' });
        res.status(500).json({ status: 'error', message: 'Error al crear la promoción' });
    }
};

const getPromociones = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM promociones ORDER BY fecha_inicio DESC');
        res.status(200).json({ status: 'success', total: result.rowCount, data: result.rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error al obtener promociones' });
    }
};

module.exports = { crearPromocion, getPromociones };