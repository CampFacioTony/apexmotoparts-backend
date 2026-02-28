const { z } = require('zod');

const registrarCompraSchema = z.object({
    proveedor_id: z.string().uuid("ID de proveedor inválido"),
    numero_factura: z.string().min(1, "Debes ingresar un número de factura o referencia"),
    numero_pedimento: z.string().optional(), // El documento oficial de la aduana
    
    // Los datos financieros generales del contenedor
    tipo_cambio: z.number().positive("El tipo de cambio debe ser mayor a 0").default(1),
    gastos_envio: z.number().min(0, "El flete no puede ser negativo").default(0),
    gastos_aduana: z.number().min(0, "Los impuestos no pueden ser negativos").default(0),

    articulos: z.array(z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        ubicacion_id: z.string().uuid("ID de ubicación inválido"),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
        costo_origen: z.number().min(0, "El costo de fábrica no puede ser negativo") // Lo que costó en USD o Moneda Origen
    })).min(1, "La orden de entrada no puede estar vacía")
});

module.exports = { registrarCompraSchema };