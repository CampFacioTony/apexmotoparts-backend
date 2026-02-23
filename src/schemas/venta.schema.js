const { z } = require('zod');

const registrarVentaSchema = z.object({
    // 1. El carrito de compras
    articulos: z.array(z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        ubicacion_id: z.string().uuid("ID de ubicación inválido"),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0")
    })).min(1, "El carrito no puede estar vacío"),
    
    // 2. NUEVO: Lista de métodos de pago (Permite pagos combinados)
    pagos: z.array(z.object({
        metodo_pago: z.enum(['EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA'], {
            errorMap: () => ({ message: "Método de pago no válido" })
        }),
        monto: z.number().positive("El monto a pagar debe ser mayor a 0")
    })).min(1, "Debe registrar al menos un método de pago")
});

module.exports = { registrarVentaSchema };