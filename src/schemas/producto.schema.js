const { z } = require('zod');

// 1. Reglas para CREAR (Ya lo tenías)
const crearProductoSchema = z.object({
    sku: z.string({ required_error: "El SKU es obligatorio" }).min(3, "El SKU debe tener al menos 3 caracteres"),
    nombre: z.string({ required_error: "El nombre es obligatorio" }).min(5, "El nombre es muy corto"),
    descripcion: z.string().optional(),
    gama: z.enum(['BAJA', 'MEDIA', 'ALTA', 'OEM'], { errorMap: () => ({ message: "Gama inválida" }) }).optional(),
    precio_venta: z.number({ required_error: "El precio es obligatorio" }).positive("El precio no puede ser negativo"),
    stock_actual: z.number().int().nonnegative("El stock no puede ser negativo").optional(),
});

// 2. NUEVO: Reglas para ACTUALIZAR (Todo es opcional)
const actualizarProductoSchema = z.object({
    sku: z.string().min(3).optional(),
    nombre: z.string().min(5).optional(),
    descripcion: z.string().optional(),
    gama: z.enum(['BAJA', 'MEDIA', 'ALTA', 'OEM']).optional(),
    precio_venta: z.number().positive().optional(),
    stock_actual: z.number().int().nonnegative().optional(),
});

// Asegúrate de exportar ambos
module.exports = {
    crearProductoSchema,
    actualizarProductoSchema
};