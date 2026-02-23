const { z } = require('zod');

const agregarCompatibilidadSchema = z.object({
    // Zod tiene una validación especial para asegurarse de que el texto sea un UUID válido de Postgres
    producto_id: z.string().uuid("El ID del producto no es válido"),
    vehiculo_id: z.string().uuid("El ID del vehículo no es válido"),
    
    // Los años específicos son opcionales por si la pieza le queda a todo el modelo sin importar el año
    anio_especifico_inicio: z.number().int().min(1950, "Año inválido").optional(),
    anio_especifico_fin: z.number().int().min(1950, "Año inválido").optional(),
});

module.exports = {
    agregarCompatibilidadSchema
};