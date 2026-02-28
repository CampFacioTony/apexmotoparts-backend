const pool = require('../config/db');

const registrarEntrada = async (req, res) => {
    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); 

        const { proveedor_id, numero_factura, numero_pedimento, tipo_cambio, gastos_envio, gastos_aduana, articulos } = req.body;
        const usuario_id = req.usuario.id;

        // 1. Calcular el valor puro de la mercancía (En Pesos MXN)
        let subtotalMercanciaMXN = 0;
        for (let art of articulos) {
            // Verificamos que los IDs existan
            const prodRes = await client.query('SELECT id, nombre FROM productos WHERE id = $1', [art.producto_id]);
            if (prodRes.rowCount === 0) throw new Error(`El producto no existe.`);
            const ubiRes = await client.query('SELECT id FROM ubicaciones WHERE id = $1', [art.ubicacion_id]);
            if (ubiRes.rowCount === 0) throw new Error(`La ubicación no existe.`);

            const costoTotalArticuloMXN = (parseFloat(art.costo_origen) * tipo_cambio) * art.cantidad;
            subtotalMercanciaMXN += costoTotalArticuloMXN;
        }

        // 2. Calcular el Factor de Prorrateo (La magia del Landed Cost)
        const totalGastosExtra = parseFloat(gastos_envio) + parseFloat(gastos_aduana);
        // Si la mercancía costó 0 (un regalo), el factor es 0 para evitar errores matemáticos
        const factorGasto = subtotalMercanciaMXN > 0 ? (totalGastosExtra / subtotalMercanciaMXN) : 0;
        const totalCompraFinal = subtotalMercanciaMXN + totalGastosExtra;

        // 3. Crear el Documento de Recepción (El Contenedor)
        const compraRes = await client.query(
            `INSERT INTO compras (proveedor_id, usuario_id, numero_factura, numero_pedimento, subtotal_mercancia, gastos_envio, gastos_aduana, tipo_cambio, total_compra, actualizado_por) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [proveedor_id, usuario_id, numero_factura, numero_pedimento, subtotalMercanciaMXN, gastos_envio, gastos_aduana, tipo_cambio, totalCompraFinal, usuario_id]
        );
        const compra_id = compraRes.rows[0].id;

        // 4. Distribuir mercancía y calcular el COSTO REAL de cada pieza
        for (let art of articulos) {
            const costoBaseMXN = parseFloat(art.costo_origen) * tipo_cambio;
            // El costo unitario final incluye su fracción exacta de fletes y aduanas
            const costoUnitarioFinal = costoBaseMXN + (costoBaseMXN * factorGasto);

            await client.query(
               `INSERT INTO compras_detalles (compra_id, producto_id, ubicacion_id, cantidad, costo_unitario, costo_origen, costo_unitario_final, actualizado_por) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [compra_id, art.producto_id, art.ubicacion_id, art.cantidad,costoUnitarioFinal, art.costo_origen, costoUnitarioFinal, usuario_id]
            );

            await client.query('UPDATE productos SET stock_actual = stock_actual + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [art.cantidad, art.producto_id]);
            
            await client.query(`
                INSERT INTO inventario_fisico (producto_id, ubicacion_id, cantidad) VALUES ($1, $2, $3)
                ON CONFLICT (producto_id, ubicacion_id) DO UPDATE SET cantidad = inventario_fisico.cantidad + EXCLUDED.cantidad, ultima_actualizacion = CURRENT_TIMESTAMP;
            `, [art.producto_id, art.ubicacion_id, art.cantidad]);

            await client.query(`
                INSERT INTO historial_inventario (producto_id, ubicacion_id, usuario_id, cantidad, tipo_movimiento, notas)
                VALUES ($1, $2, $3, $4, 'ENTRADA', 'Recepción de proveedor - Factura: ' || $5)
            `, [art.producto_id, art.ubicacion_id, usuario_id, art.cantidad, numero_factura]);
        }

        await client.query('COMMIT'); 
        res.status(201).json({ 
            status: 'success', 
            message: 'Mercancía ingresada y costos prorrateados exitosamente', 
            recepcion_id: compra_id,
            analisis_financiero: {
                mercancia_mxn: subtotalMercanciaMXN,
                gastos_extras_mxn: totalGastosExtra,
                total_inversion: totalCompraFinal,
                factor_prorrateo: `${(factorGasto * 100).toFixed(2)}%` // Te dice qué porcentaje se encareció la mercancía
            }
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Entrada cancelada:', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        client.release();
    }
};

module.exports = { registrarEntrada };