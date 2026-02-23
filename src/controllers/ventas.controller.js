const pool = require('../config/db');

const realizarVenta = async (req, res) => {
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

        // Extraemos los nuevos campos opcionales
        const { articulos, pagos, canal_venta = 'MOSTRADOR_FISICO', cliente_id, codigo_promocion } = req.body;
        const usuario_id = req.usuario.id;

        let subtotal = 0;
        let descuentoAplicado = 0;
        let totalPagado = 0;
        let promocion_id = null;

        // --- FASE 1: VERIFICACIÓN DEL CARRITO Y SUBTOTAL ---
        for (let art of articulos) {
            const prodRes = await client.query('SELECT precio_venta, stock_actual, nombre FROM productos WHERE id = $1', [art.producto_id]);
            if (prodRes.rowCount === 0) throw new Error(`El producto no existe`);
            const producto = prodRes.rows[0];

            if (producto.stock_actual < art.cantidad) throw new Error(`Stock insuficiente para: ${producto.nombre}`);

            const invRes = await client.query('SELECT cantidad FROM inventario_fisico WHERE producto_id = $1 AND ubicacion_id = $2', [art.producto_id, art.ubicacion_id]);
            if (invRes.rowCount === 0 || invRes.rows[0].cantidad < art.cantidad) {
                throw new Error(`No hay suficientes piezas en ese pasillo/rack para: ${producto.nombre}`);
            }

            subtotal += parseFloat(producto.precio_venta) * art.cantidad;
        }

        // --- FASE 2: APLICAR PROMOCIÓN (SI EXISTE) ---
        if (codigo_promocion) {
            // Buscamos si el cupón es válido hoy
            const promoRes = await client.query(`
                SELECT id, tipo_descuento, valor_descuento 
                FROM promociones 
                WHERE codigo = $1 AND activo = true 
                AND CURRENT_TIMESTAMP BETWEEN fecha_inicio AND fecha_fin
            `, [codigo_promocion.toUpperCase()]);

            if (promoRes.rowCount === 0) {
                throw new Error('El código de promoción no existe, está inactivo o ya caducó');
            }

            const promo = promoRes.rows[0];
            promocion_id = promo.id;

            // Matemáticas del descuento
            if (promo.tipo_descuento === 'PORCENTAJE') {
                descuentoAplicado = subtotal * (parseFloat(promo.valor_descuento) / 100);
            } else if (promo.tipo_descuento === 'MONTO_FIJO') {
                descuentoAplicado = parseFloat(promo.valor_descuento);
            }

            // Evitamos que el descuento sea mayor al subtotal (que no te queden a deber)
            if (descuentoAplicado > subtotal) descuentoAplicado = subtotal;
        }

        const totalVenta = subtotal - descuentoAplicado;

        // --- FASE 3: VERIFICACIÓN DE PAGOS COMBINADOS ---
        for (let pago of pagos) {
            totalPagado += parseFloat(pago.monto);
        }

        if (Math.abs(totalPagado - totalVenta) > 0.01) {
            throw new Error(`Los pagos no cuadran. El total con descuento es $${totalVenta} pero se entregaron $${totalPagado}`);
        }

        // --- FASE 4: EL TICKET GENERAL (AHORA CON CLIENTE Y DESCUENTO) ---
        const ventaRes = await client.query(
            `INSERT INTO ventas (usuario_id, cliente_id, promocion_id, subtotal, descuento_aplicado, total, canal_venta) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [usuario_id, cliente_id, promocion_id, subtotal, descuentoAplicado, totalVenta, canal_venta]
        );
        const venta_id = ventaRes.rows[0].id;

        // --- FASE 5: REGISTRAR PAGOS COMBINADOS ---
        for (let pago of pagos) {
            await client.query(
                'INSERT INTO ventas_pagos (venta_id, metodo_pago, monto) VALUES ($1, $2, $3)',
                [venta_id, pago.metodo_pago, pago.monto]
            );
        }

        // --- FASE 6: DESCONTAR PIEZAS Y REGISTRAR MOVIMIENTOS ---
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
            resumen: { subtotal, descuento: descuentoAplicado, total_cobrado: totalVenta },
            desglose_pagos: pagos
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