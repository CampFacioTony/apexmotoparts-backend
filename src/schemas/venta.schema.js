const { z } = require('zod');

const registrarVentaSchema = z.object({
    // Recibimos un "arreglo" (lista) de artículos a comprar
    articulos: z.array(z.object({
        producto_id: z.string().uuid("ID de producto inválido"),
        ubicacion_id: z.string().uuid("ID de ubicación inválido"),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0")
    })).min(1, "El carrito no puede estar vacío")
});

module.exports = { registrarVentaSchema };