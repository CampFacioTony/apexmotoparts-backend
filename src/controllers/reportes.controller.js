const pool = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        // 1. ¿Cuánto hemos vendido este mes?
        const ventasMesQuery = `
            SELECT COALESCE(SUM(total), 0) AS ingresos_mes, COUNT(id) AS total_tickets
            FROM ventas
            WHERE EXTRACT(MONTH FROM fecha_venta) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM fecha_venta) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND estatus = 'COMPLETADA';
        `;

        // 2. El Top 5 de Refacciones Más Vendidas (Los productos estrella)
        const topProductosQuery = `
            SELECT p.sku, p.nombre, SUM(vd.cantidad) AS total_piezas_vendidas
            FROM ventas_detalles vd
            INNER JOIN productos p ON vd.producto_id = p.id
            INNER JOIN ventas v ON vd.venta_id = v.id
            WHERE v.estatus = 'COMPLETADA'
            GROUP BY p.id, p.sku, p.nombre
            ORDER BY total_piezas_vendidas DESC
            LIMIT 5;
        `;

        // 3. Alertas de Reabastecimiento (Piezas con 5 o menos en stock)
        const stockBajoQuery = `
            SELECT sku, nombre, stock_actual 
            FROM productos 
            WHERE stock_actual <= 5 AND activo = true
            ORDER BY stock_actual ASC;
        `;

        // Ejecutamos las 3 consultas al mismo tiempo para que sea súper rápido
        const [ventasMes, topProductos, stockBajo] = await Promise.all([
            pool.query(ventasMesQuery),
            pool.query(topProductosQuery),
            pool.query(stockBajoQuery)
        ]);

        // Empaquetamos todo en un JSON hermoso y ordenado
        res.status(200).json({
            status: 'success',
            data: {
                resumen_financiero: {
                    mes_actual: ventasMes.rows[0]
                },
                top_ventas: topProductos.rows,
                alertas_inventario: {
                    total_productos_criticos: stockBajo.rowCount,
                    productos: stockBajo.rows
                }
            }
        });

    } catch (error) {
        console.error('Error al generar el dashboard:', error);
        res.status(500).json({ status: 'error', message: 'Error interno al generar reportes' });
    }
};

module.exports = { getDashboard };