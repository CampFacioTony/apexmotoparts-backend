const { z } = require('zod');

const registrarVentaSchema = z.object({
    // Datos opcionales del cliente y cupón
    cliente_id: z.string().uuid("ID de cliente inválido").optional(),
    codigo_promocion: z.string().min(3, "El código es muy corto").optional(),
    canal_venta: z.enum(['MOSTRADOR_FISICO', 'WOOCOMMERCE', 'MERCADOLIBRE', 'AMAZON']).optional(),

    articulos: z.array(z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        ubicacion_id: z.string().uuid("ID de ubicación inválido"),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0")
    })).min(1, "El carrito no puede estar vacío"),
    
    pagos: z.array(z.object({
        metodo_pago: z.enum(['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA']),
        monto: z.number().positive("El monto a pagar debe ser mayor a 0")
    })).min(1, "Debe registrar al menos un método de pago")
});

module.exports = { registrarVentaSchema };