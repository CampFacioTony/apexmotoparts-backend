const pool = require('../config/db');

const realizarVenta = async (req, res) => {
    // Para las transacciones, necesitamos "secuestrar" una conexión exclusiva a la base de datos
    const client = await pool.connect(); 

    try {
        // ¡Empezamos la transacción! (Todo o Nada)
        await client.query('BEGIN'); 

        const { articulos } = req.body;
        const usuario_id = req.usuario.id; // ¡Gracias al Gafete VIP, sabemos qué empleado está cobrando!

        let totalVenta = 0;

        // --- FASE 1: VERIFICACIÓN ---
        // Revisamos que haya stock suficiente para TODO el carrito antes de tocar nada
        for (let art of articulos) {
            // Buscamos el precio y stock global
            const prodRes = await client.query('SELECT precio_venta, stock_actual, nombre FROM productos WHERE id = $1', [art.producto_id]);
            if (prodRes.rowCount === 0) throw new Error(`El producto no existe`);
            const producto = prodRes.rows[0];

            if (producto.stock_actual < art.cantidad) {
                throw new Error(`Stock insuficiente para la pieza: ${producto.nombre}`);
            }

            // Revisamos que haya stock FÍSICO en el rack que eligieron
            const invRes = await client.query('SELECT cantidad FROM inventario_fisico WHERE producto_id = $1 AND ubicacion_id = $2', [art.producto_id, art.ubicacion_id]);
            if (invRes.rowCount === 0 || invRes.rows[0].cantidad < art.cantidad) {
                throw new Error(`No hay suficientes piezas en ese pasillo/rack para: ${producto.nombre}`);
            }

            // Sumamos al ticket
            totalVenta += parseFloat(producto.precio_venta) * art.cantidad;
        }

        // --- FASE 2: EL COBRO Y EL TICKET ---
        const ventaRes = await client.query(
            'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING id',
            [usuario_id, totalVenta]
        );
        const venta_id = ventaRes.rows[0].id;

        // --- FASE 3: DESCONTAR PIEZAS Y REGISTRAR MOVIMIENTOS ---
        for (let art of articulos) {
            // Obtenemos el precio al momento de la venta
            const prodRes = await client.query('SELECT precio_venta FROM productos WHERE id = $1', [art.producto_id]);
            const precio = prodRes.rows[0].precio_venta;

            // 1. Imprimir la línea en el ticket (Detalle)
            await client.query(
                'INSERT INTO ventas_detalles (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [venta_id, art.producto_id, art.cantidad, precio]
            );

            // 2. Restar del catálogo general
            await client.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [art.cantidad, art.producto_id]
            );

            // 3. Restar del rack físico en tu WMS
            await client.query(
                'UPDATE inventario_fisico SET cantidad = cantidad - $1 WHERE producto_id = $2 AND ubicacion_id = $3',
                [art.cantidad, art.producto_id, art.ubicacion_id]
            );

            // 4. Dejar huella en la bitácora de auditoría
            await client.query(
                `INSERT INTO historial_inventario (producto_id, ubicacion_id, usuario_id, cantidad, tipo_movimiento, notas)
                 VALUES ($1, $2, $3, $4, 'SALIDA', 'Venta generada - Ticket ID: ' || $5)`,
                [art.producto_id, art.ubicacion_id, usuario_id, art.cantidad, venta_id]
            );
        }

        // Si llegamos hasta aquí, todo salió perfecto. ¡Guardamos permanentemente!
        await client.query('COMMIT'); 
        res.status(201).json({ 
            status: 'success', 
            message: 'Venta completada exitosamente', 
            ticket: venta_id, 
            total_pagado: totalVenta 
        });

    } catch (error) {
        // Si CUALQUIER COSA falla (falta de stock, error de BD), hacemos reversa automática
        await client.query('ROLLBACK'); 
        console.error('Venta cancelada:', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        client.release(); // Liberamos la conexión para que otros empleados puedan vender
    }
};

module.exports = { realizarVenta };