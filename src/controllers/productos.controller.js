const pool = require('../config/db');

// 1. Función para LEER productos (La que ya tenías)
const getProductos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        res.status(200).json({
            status: 'success',
            total: result.rowCount,
            data: result.rows
        });
    } catch (error) {
        console.error('Error al consultar productos:', error);
        res.status(500).json({ status: 'error', message: 'Error en base de datos' });
    }
};

// 2. NUEVA Función para CREAR un producto
const crearProducto = async (req, res) => {
    try {
        // ¡Ya no necesitamos los "if" manuales! Zod ya garantizó que esto viene perfecto
        const { sku, nombre, descripcion, gama, precio_venta, stock_actual } = req.body;

        const query = `
            INSERT INTO productos (sku, nombre, descripcion, gama, precio_venta, stock_actual)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        
        const values = [sku, nombre, descripcion, gama || 'MEDIA', precio_venta, stock_actual || 0];
        const result = await pool.query(query, values);

        res.status(201).json({
            status: 'success',
            message: 'Refacción registrada con éxito',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ese SKU ya está registrado.' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// ... (Aquí arriba están getProductos y crearProducto que ya tenías)

// 3. NUEVA Función para ACTUALIZAR un producto
const actualizarProducto = async (req, res) => {
    try {
        // Obtenemos el ID de la URL (ej. /api/productos/1234-abcd)
        const { id } = req.params; 
        
        // Obtenemos los datos a cambiar desde Postman
        const { sku, nombre, descripcion, gama, precio_venta, stock_actual } = req.body;

        // La magia de COALESCE: Si le mandas un dato nuevo, lo usa. Si no le mandas nada, deja el que ya estaba.
        const query = `
            UPDATE productos 
            SET 
                sku = COALESCE($1, sku),
                nombre = COALESCE($2, nombre),
                descripcion = COALESCE($3, descripcion),
                gama = COALESCE($4, gama),
                precio_venta = COALESCE($5, precio_venta),
                stock_actual = COALESCE($6, stock_actual),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *;
        `;
        
        // Pasamos los valores en orden (el $7 es el ID)
        const values = [sku, nombre, descripcion, gama, precio_venta, stock_actual, id];
        
        const result = await pool.query(query, values);

        // Si PostgreSQL no encontró el ID, avisamos
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'No se encontró la refacción con ese ID' });
        }

        // Si todo salió bien, devolvemos el producto actualizado
        res.status(200).json({
            status: 'success',
            message: 'Refacción actualizada con éxito',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        if (error.code === '22P02') {
            return res.status(400).json({ status: 'error', message: 'El ID proporcionado no es un UUID válido' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 4. NUEVA Función para ELIMINAR (Soft Delete)
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // En lugar de usar DELETE FROM, usamos UPDATE para poner activo = false
        const query = `
            UPDATE productos 
            SET activo = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'No se encontró la refacción' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Refacción eliminada del catálogo exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        if (error.code === '22P02') {
            return res.status(400).json({ status: 'error', message: 'El ID no es válido' });
        }
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};

// 5. NUEVA Función para SUBIR LA FOTO
const subirImagenProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // Si Multer no encontró ningún archivo en la petición
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Por favor selecciona una imagen.' });
        }

        // Armamos la URL pública (ej. /uploads/productos/123-456.jpg)
        const imagen_url = `/uploads/productos/${req.file.filename}`;

        // Actualizamos la base de datos de tu refacción
        const query = `
            UPDATE productos 
            SET imagen_url = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *;
        `;
        const result = await pool.query(query, [imagen_url, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'No se encontró la refacción' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Imagen del producto guardada exitosamente',
            imagen_url: imagen_url,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ status: 'error', message: 'Error interno al procesar la imagen' });
    }
};

// Exportamos las tres funciones
module.exports = {
    getProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    subirImagenProducto
};

