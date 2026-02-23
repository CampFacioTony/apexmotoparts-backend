const { z } = require('zod');

// Reglas para registrar un Cliente
const crearClienteSchema = z.object({
    nombre_completo: z.string().min(3, "El nombre debe tener al menos 3 letras"),
    email: z.string().email("Correo no válido").optional().or(z.literal('')),
    telefono: z.string().optional(),
    nivel_lealtad: z.enum(['BRONCE', 'PLATA', 'ORO', 'VIP']).optional()
});

// Reglas para crear un Cupón de Promoción
const crearPromocionSchema = z.object({
    codigo: z.string().min(3, "El código es muy corto"),
    descripcion: z.string().optional(),
    tipo_descuento: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
    valor_descuento: z.number().positive("El descuento debe ser mayor a 0"),
    // Pedimos las fechas en formato de texto (Ej: 2026-11-20)
    fecha_inicio: z.string().min(10, "Usa el formato AAAA-MM-DD"),
    fecha_fin: z.string().min(10, "Usa el formato AAAA-MM-DD")
});

module.exports = { crearClienteSchema, crearPromocionSchema };