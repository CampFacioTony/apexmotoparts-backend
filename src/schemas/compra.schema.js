const { z } = require('zod');

const registrarCompraSchema = z.object({
    proveedor_id: z.string().uuid("ID de proveedor inválido"),
    numero_factura: z.string().min(1, "Debes ingresar un número de factura o referencia"),
    
    // Lista de mercancía que llegó en el lote
    articulos: z.array(z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        ubicacion_id: z.string().uuid("ID de ubicación inválido"), // ¡Obligamos a usar el WMS!
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
        costo_unitario: z.number().min(0, "El costo no puede ser negativo") // Cuánto nos costó traerla
    })).min(1, "La orden de entrada no puede estar vacía")
});

module.exports = { registrarCompraSchema };