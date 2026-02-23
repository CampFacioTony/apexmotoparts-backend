const pool = require('../config/db');

const realizarVenta = async (req, res) => {
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

        // ¡Ahora extraemos también los pagos desde Postman/Web!
        const { articulos, pagos } = req.body;
        const usuario_id = req.usuario.id;

        let totalVenta = 0;
        let totalPagado = 0;

        // --- FASE 1: VERIFICACIÓN DEL CARRITO ---
        for (let art of articulos) {
            const prodRes = await client.query('SELECT precio_venta, stock_actual, nombre FROM productos WHERE id = $1', [art.producto_id]);
            if (prodRes.rowCount === 0) throw new Error(`El producto no existe`);
            const producto = prodRes.rows[0];

            if (producto.stock_actual < art.cantidad) throw new Error(`Stock insuficiente para: ${producto.nombre}`);

            const invRes = await client.query('SELECT cantidad FROM inventario_fisico WHERE producto_id = $1 AND ubicacion_id = $2', [art.producto_id, art.ubicacion_id]);
            if (invRes.rowCount === 0 || invRes.rows[0].cantidad < art.cantidad) {
                throw new Error(`No hay suficientes piezas en ese pasillo/rack para: ${producto.nombre}`);
            }

            totalVenta += parseFloat(producto.precio_venta) * art.cantidad;
        }

        // --- FASE 2: VERIFICACIÓN DE LOS PAGOS COMBINADOS ---
        // Sumamos todo lo que el cliente nos está entregando (Efectivo + Tarjeta, etc)
        for (let pago of pagos) {
            totalPagado += parseFloat(pago.monto);
        }

        // Regla de Oro: Lo pagado debe cubrir el total de la venta
        // Usamos Math.abs para evitar problemas de decimales mínimos (ej. 100.0000001 !== 100)
        if (Math.abs(totalPagado - totalVenta) > 0.01) {
            throw new Error(`Los pagos no cuadran. El total a pagar es $${totalVenta} pero se están entregando $${totalPagado}`);
        }

        // --- FASE 3: EL TICKET GENERAL ---
        const ventaRes = await client.query(
            'INSERT INTO ventas (usuario_id, total) VALUES ($1, $2) RETURNING id',
            [usuario_id, totalVenta]
        );
        const venta_id = ventaRes.rows[0].id;

        // --- FASE 4: REGISTRAR LOS PAGOS COMBINADOS ---
        for (let pago of pagos) {
            await client.query(
                'INSERT INTO ventas_pagos (venta_id, metodo_pago, monto) VALUES ($1, $2, $3)',
                [venta_id, pago.metodo_pago, pago.monto]
            );
        }

        // --- FASE 5: DESCONTAR PIEZAS Y REGISTRAR MOVIMIENTOS ---
        for (let art of articulos) {
            const prodRes = await client.query('SELECT precio_venta FROM productos WHERE id = $1', [art.producto_id]);
            const precio = prodRes.rows[0].precio_venta;

            await client.query(
                'INSERT INTO ventas_detalles (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [venta_id, art.producto_id, art.cantidad, precio]
            );

            await client.query('UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2', [art.cantidad, art.producto_id]);
            await client.query('UPDATE inventario_fisico SET cantidad = cantidad - $1 WHERE producto_id = $2 AND ubicacion_id = $3', [art.cantidad, art.producto_id, art.ubicacion_id]);
            
            await client.query(
                `INSERT INTO historial_inventario (producto_id, ubicacion_id, usuario_id, cantidad, tipo_movimiento, notas)
                 VALUES ($1, $2, $3, $4, 'SALIDA', 'Venta generada - Ticket ID: ' || $5)`,
                [art.producto_id, art.ubicacion_id, usuario_id, art.cantidad, venta_id]
            );
        }

        await client.query('COMMIT'); 
        res.status(201).json({ 
            status: 'success', 
            message: 'Venta cobrada exitosamente', 
            ticket: venta_id, 
            total_venta: totalVenta,
            desglose_pagos: pagos // Le devolvemos el resumen de cómo pagó
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Venta cancelada:', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        client.release();
    }
};

module.exports = { realizarVenta };