const { z } = require('zod');

// Reglas para registrar un "Hueco" o ubicación física en tu bodega
const crearUbicacionSchema = z.object({
    zona: z.string({ required_error: "La zona es obligatoria" }).min(2, "Nombre de zona muy corto"),
    pasillo: z.string({ required_error: "El pasillo es obligatorio" }),
    rack: z.string({ required_error: "El rack es obligatorio" }),
    nivel: z.string({ required_error: "El nivel es obligatorio" }),
    codigo_barras: z.string({ required_error: "El código de barras o QR es obligatorio" })
});

// Reglas para meter piezas a una ubicación específica
const depositarInventarioSchema = z.object({
    producto_id: z.string().uuid("El ID del producto no es válido"),
    ubicacion_id: z.string().uuid("El ID de la ubicación no es válido"),
    cantidad: z.number().int().positive("Debes depositar al menos 1 pieza")
});

module.exports = {
    crearUbicacionSchema,
    depositarInventarioSchema
};