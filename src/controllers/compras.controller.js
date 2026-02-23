const pool = require('../config/db');

const registrarEntrada = async (req, res) => {
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); // Activamos el escudo: Todo o Nada

        const { proveedor_id, numero_factura, articulos } = req.body;
        const usuario_id = req.usuario.id;

        let totalCompra = 0;

        // --- FASE 1: VERIFICACIÓN Y MATEMÁTICAS ---
        for (let art of articulos) {
            // 1. Verificar que el producto exista realmente
            const prodRes = await client.query('SELECT id, nombre FROM productos WHERE id = $1', [art.producto_id]);
            if (prodRes.rowCount === 0) throw new Error(`El producto con ID ${art.producto_id} no existe.`);

            // 2. Verificar que la ubicación (rack/pasillo) exista en el mapa de tu bodega
            const ubiRes = await client.query('SELECT id FROM ubicaciones WHERE id = $1', [art.ubicacion_id]);
            if (ubiRes.rowCount === 0) throw new Error(`La ubicación seleccionada para ${prodRes.rows[0].nombre} no existe en la bodega.`);

            // Sumamos el total de dinero invertido en este lote
            totalCompra += parseFloat(art.costo_unitario) * art.cantidad;
        }

        // --- FASE 2: CREAR EL DOCUMENTO DE RECEPCIÓN ---
        const compraRes = await client.query(
            `INSERT INTO compras (proveedor_id, usuario_id, numero_factura, total_compra) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [proveedor_id, usuario_id, numero_factura, totalCompra]
        );
        const compra_id = compraRes.rows[0].id;

        // --- FASE 3: DISTRIBUIR LA MERCANCÍA Y SUMAR STOCK ---
        for (let art of articulos) {
            // 1. Guardar el detalle de la factura
            await client.query(
                `INSERT INTO compras_detalles (compra_id, producto_id, ubicacion_id, cantidad, costo_unitario) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [compra_id, art.producto_id, art.ubicacion_id, art.cantidad, art.costo_unitario]
            );

            // 2. Sumar al stock global del catálogo
            await client.query(
                'UPDATE productos SET stock_actual = stock_actual + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [art.cantidad, art.producto_id]
            );

            // 3. Acomodar físicamente en el WMS (Si ya hay, suma. Si no hay, inserta)
            await client.query(`
                INSERT INTO inventario_fisico (producto_id, ubicacion_id, cantidad)
                VALUES ($1, $2, $3)
                ON CONFLICT (producto_id, ubicacion_id) 
                DO UPDATE SET 
                    cantidad = inventario_fisico.cantidad + EXCLUDED.cantidad,
                    ultima_actualizacion = CURRENT_TIMESTAMP;
            `, [art.producto_id, art.ubicacion_id, art.cantidad]);

            // 4. Dejar rastro en la bitácora del auditor
            await client.query(`
                INSERT INTO historial_inventario (producto_id, ubicacion_id, usuario_id, cantidad, tipo_movimiento, notas)
                VALUES ($1, $2, $3, $4, 'ENTRADA', 'Recepción de proveedor - Factura: ' || $5)
            `, [art.producto_id, art.ubicacion_id, usuario_id, art.cantidad, numero_factura]);
        }

        await client.query('COMMIT'); // ¡Éxito! Guardamos todo permanentemente.
        res.status(201).json({ 
            status: 'success', 
            message: 'Mercancía ingresada y acomodada exitosamente en la bodega', 
            recepcion_id: compra_id,
            total_invertido: totalCompra
        });

    } catch (error) {
        await client.query('ROLLBACK'); // ¡Pánico! Algo falló, cancelamos todo para no dañar el stock.
        console.error('Entrada cancelada:', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        client.release();
    }
};

module.exports = { registrarEntrada };