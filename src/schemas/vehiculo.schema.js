const { z } = require('zod');

// 1. Reglas para CREAR un vehículo en el catálogo
const crearVehiculoSchema = z.object({
    tipo: z.enum(['MOTO', 'ATV', 'UTV'], {
        required_error: "El tipo es obligatorio",
        invalid_type_error: "El tipo solo puede ser MOTO, ATV o UTV"
    }),
    marca: z.string({ required_error: "La marca es obligatoria" }).min(2, "La marca es muy corta"),
    modelo: z.string({ required_error: "El modelo es obligatorio" }).min(2, "El modelo es muy corto"),
    cilindrada: z.number().int("La cilindrada debe ser un número entero (ej. 1000)").positive().optional(),
    anio_inicio: z.number({ required_error: "El año de inicio es obligatorio" }).int().min(1950, "Año inválido"),
    anio_fin: z.number().int().min(1950).optional(),
});

// 2. Reglas para ACTUALIZAR (Todo opcional)
const actualizarVehiculoSchema = z.object({
    tipo: z.enum(['MOTO', 'ATV', 'UTV']).optional(),
    marca: z.string().min(2).optional(),
    modelo: z.string().min(2).optional(),
    cilindrada: z.number().int().positive().optional(),
    anio_inicio: z.number().int().min(1950).optional(),
    anio_fin: z.number().int().min(1950).optional(),
});

module.exports = {
    crearVehiculoSchema,
    actualizarVehiculoSchema
};